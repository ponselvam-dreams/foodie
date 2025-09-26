from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.deps import get_db
from app.models.community_post import CommunityPost as CommunityPostModel

router = APIRouter(prefix="", tags=["Community"])

class CommunityPostIn(BaseModel):
    title: str
    ingredients: List[str]
    steps: List[str]
    video_url: str | None = None
    author: str

@router.post("/community-post")
def community_post(payload: CommunityPostIn, db: Session = Depends(get_db)):
    post = CommunityPostModel(
        title=payload.title,
        ingredients=",".join(payload.ingredients),
        steps="|".join(payload.steps),
        video_url=payload.video_url,
        author=payload.author,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return {"message": "Recipe shared with community 🍲", "post_id": post.id}

@router.get("/community-feed")
def community_feed(db: Session = Depends(get_db)):
    posts = db.query(CommunityPostModel).all()
    return {
        "posts": [
            {
                "id": p.id,
                "title": p.title,
                "ingredients": p.ingredients.split(",") if p.ingredients else [],
                "steps": p.steps.split("|") if p.steps else [],
                "video_url": p.video_url,
                "author": p.author,
            }
            for p in posts
        ]
    }