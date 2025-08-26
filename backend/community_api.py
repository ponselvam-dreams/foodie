# community_api.py
from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Dict, List, Optional, Set
from uuid import uuid4

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel, Field

router = APIRouter()

# -----------------------------
# In-memory "database"
# -----------------------------
POSTS: Dict[str, dict] = {}          # post_id -> post
COMMENTS: Dict[str, List[dict]] = {} # post_id -> [{user,text,createdAt}]
REVIEWS: Dict[str, List[dict]] = {}  # post_id -> [{user,rating,review,createdAt}]
FOLLOWS: Dict[str, Set[str]] = {}    # user -> set(targets)

def now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"

def compute_rating(post_id: str) -> float:
    lst = REVIEWS.get(post_id, [])
    if not lst:
        return 0.0
    return round(sum(x.get("rating", 0) for x in lst) / len(lst), 1)

# -----------------------------
# Schemas
# -----------------------------
class CommunityPostIn(BaseModel):
    title: str
    ingredients: List[str] = []
    steps: List[str] = []
    video_url: Optional[str] = None
    image_url: Optional[str] = None
    author: str = "Anonymous"
    avatar: Optional[str] = None

class CommunityPostOut(BaseModel):
    id: str
    title: str
    author: str
    avatar: Optional[str] = None
    image: Optional[str] = None
    video_url: Optional[str] = None
    likes: int = 0
    rating: float = 0.0
    comments: List[dict] = []
    createdAt: str

class ReviewIn(BaseModel):
    # You can pass either post_id OR recipe_title (we'll resolve by title)
    post_id: Optional[str] = None
    recipe_title: Optional[str] = None
    user: str
    rating: float = Field(ge=0, le=5)
    review: Optional[str] = None

class CommentIn(BaseModel):
    post_id: str
    user: str
    text: str

class FollowIn(BaseModel):
    user: str
    target: str
    action: Optional[str] = "follow"  # follow | unfollow

# -----------------------------
# Routes
# -----------------------------

@router.get("/community-feed")
def community_feed():
    """Return a list of posts with comments and rating."""
    items: List[CommunityPostOut] = []
    for pid, post in POSTS.items():
        out = {
            "id": pid,
            "title": post["title"],
            "author": post["author"],
            "avatar": post.get("avatar"),
            "image": post.get("image_url"),
            "video_url": post.get("video_url"),
            "likes": post.get("likes", 0),
            "rating": compute_rating(pid),
            "comments": COMMENTS.get(pid, []),
            "createdAt": post["createdAt"],
        }
        items.append(out)
    # Sort latest first
    items.sort(key=lambda x: x["createdAt"], reverse=True)
    return {"posts": items}

@router.post("/community-post")
def community_post(payload: CommunityPostIn):
    """Create a new community recipe post."""
    pid = str(uuid4())
    POSTS[pid] = {
        "id": pid,
        "title": payload.title,
        "ingredients": payload.ingredients,
        "steps": payload.steps,
        "video_url": payload.video_url,
        "image_url": payload.image_url,
        "author": payload.author or "Anonymous",
        "avatar": payload.avatar,
        "likes": 0,
        "createdAt": now_iso(),
    }
    COMMENTS[pid] = []
    REVIEWS[pid] = []
    return {"message": "Recipe shared with community 🍲", "post_id": pid}

@router.post("/review")
def review(payload: ReviewIn):
    """
    Save a rating/review for a post.
    Accepts post_id or recipe_title for convenience.
    """
    post_id = payload.post_id
    if not post_id and payload.recipe_title:
        # resolve by title (first match)
        for pid, p in POSTS.items():
            if p["title"].strip().lower() == payload.recipe_title.strip().lower():
                post_id = pid
                break
    if not post_id or post_id not in POSTS:
        raise HTTPException(status_code=404, detail="Post not found")

    REVIEWS.setdefault(post_id, []).append({
        "user": payload.user,
        "rating": payload.rating,
        "review": payload.review,
        "createdAt": now_iso(),
    })
    new_avg = compute_rating(post_id)
    return {"message": "Review saved", "post_id": post_id, "rating": new_avg}

@router.post("/community-comment")
def community_comment(payload: CommentIn):
    if payload.post_id not in POSTS:
        raise HTTPException(status_code=404, detail="Post not found")
    entry = {"user": payload.user, "text": payload.text, "createdAt": now_iso()}
    COMMENTS.setdefault(payload.post_id, []).append(entry)
    return {"message": "Comment added", "post_id": payload.post_id, "comment": entry}

@router.post("/follow")
def follow(payload: FollowIn):
    user = payload.user.strip()
    target = payload.target.strip()
    if user == target:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    FOLLOWS.setdefault(user, set())
    if payload.action == "unfollow":
        FOLLOWS[user].discard(target)
        return {"message": "Unfollowed", "following": sorted(list(FOLLOWS[user]))}
    # default: follow
    FOLLOWS[user].add(target)
    return {"message": "Following", "following": sorted(list(FOLLOWS[user]))}

# (Optional) Likes endpoint, if you want to persist likes from UI:
@router.post("/community-like/{post_id}")
def community_like(post_id: str):
    if post_id not in POSTS:
        raise HTTPException(status_code=404, detail="Post not found")
    POSTS[post_id]["likes"] = POSTS[post_id].get("likes", 0) + 1
    return {"post_id": post_id, "likes": POSTS[post_id]["likes"]}

# -----------------------------
# Minimal WebSocket chat
# -----------------------------

class RoomManager:
    def __init__(self):
        self.rooms: Dict[str, Set[WebSocket]] = {}
        self.lock = asyncio.Lock()

    async def connect(self, room: str, ws: WebSocket):
        await ws.accept()
        async with self.lock:
            self.rooms.setdefault(room, set()).add(ws)

    async def disconnect(self, room: str, ws: WebSocket):
        async with self.lock:
            if room in self.rooms and ws in self.rooms[room]:
                self.rooms[room].remove(ws)
                if not self.rooms[room]:
                    self.rooms.pop(room, None)

    async def broadcast(self, room: str, message: dict):
        # copy to avoid set size change during iteration
        targets = list(self.rooms.get(room, []))
        for ws in targets:
            try:
                await ws.send_json(message)
            except Exception:
                # ignore broken sockets
                pass

manager = RoomManager()

@router.websocket("/ws/chat")
async def chat_ws(ws: WebSocket):
    """
    Simple room-based chat.
    Connect with: ws://HOST/ws/chat?room=<roomId>&user=<name>
    """
    # Extract query params
    params = dict(ws._headers)  # fallback if needed
    query_params = ws.scope.get("query_string", b"").decode()
    # naive parse
    room = "lobby"
    user = "Guest"
    if query_params:
        parts = dict(p.split("=", 1) for p in query_params.split("&") if "=" in p)
        room = parts.get("room", room)
        user = parts.get("user", user)

    await manager.connect(room, ws)
    await manager.broadcast(room, {"system": True, "text": f"{user} joined", "ts": now_iso()})

    try:
        while True:
            data = await ws.receive_json()
            text = (data.get("text") or "").strip()
            if not text:
                continue
            await manager.broadcast(room, {"user": user, "text": text, "ts": now_iso()})
    except WebSocketDisconnect:
        await manager.disconnect(room, ws)
        await manager.broadcast(room, {"system": True, "text": f"{user} left", "ts": now_iso()})
