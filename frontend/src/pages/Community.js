import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion"; // optional: remove if not using animations

const API_BASE = "http://127.0.0.1:8000";

/** =========================
 *   Community Page
 * ========================= */
export default function Community() {
  const [tab, setTab] = useState("feed"); // feed | submit | messages | following

  return (
    <div className="min-h-[70vh]">
      <Header />

      {/* Tabs */}
      <div className="mb-6 bg-white rounded-2xl p-2 shadow flex gap-2">
        <Tab label="Feed" active={tab === "feed"} onClick={() => setTab("feed")} />
        <Tab label="Submit" active={tab === "submit"} onClick={() => setTab("submit")} />
        <Tab label="Messages" active={tab === "messages"} onClick={() => setTab("messages")} />
        <Tab label="Following" active={tab === "following"} onClick={() => setTab("following")} />
      </div>

      {tab === "feed" && <Feed />}
      {tab === "submit" && <SubmitRecipe />}
      {tab === "messages" && <Messages />}
      {tab === "following" && <Following />}
    </div>
  );
}

/** =========================
 *   Header
 * ========================= */
function Header() {
  return (
    <motion.div
      className="relative overflow-hidden rounded-3xl mb-8"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500"
        style={{ backgroundSize: "200% 200%" }}
        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />
      <div className="relative px-6 md:px-10 py-10 text-white">
        <motion.h1
          className="text-3xl md:text-4xl font-extrabold tracking-tight"
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          🍲 Community — Share, Learn, Cook Together
        </motion.h1>
        <p className="mt-2 text-white/90 max-w-2xl">
          Post your recipes, rate others, comment, follow home cooks & chat in real-time (when online).
        </p>
      </div>
    </motion.div>
  );
}

function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-4 py-2 rounded-xl font-medium ${
        active ? "bg-gray-900 text-white" : "bg-gray-100 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );
}

/** =========================
 *   Submit Recipe
 * ========================= */
function SubmitRecipe() {
  const [title, setTitle] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");
  const [video, setVideo] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [author, setAuthor] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    try {
      setLoading(true);
      setMsg("");

      // 1) Send metadata to /community-post
      const res = await fetch(`${API_BASE}/community-post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          ingredients: ingredients.split(",").map((s) => s.trim()).filter(Boolean),
          steps: steps.split("\n").map((s) => s.trim()).filter(Boolean),
          video_url: video || undefined,
          author,
        }),
      });

      let ok = res.ok;
      let data = {};
      try {
        data = await res.json();
      } catch {
        // ignore
      }

      // 2) (Optional) upload image to your storage (S3/Cloudinary). For demo: skip.

      if (!ok) throw new Error(data?.error || `Failed: ${res.status}`);
      setMsg(data.message || "Recipe shared with community 🍲");
      setTitle("");
      setIngredients("");
      setSteps("");
      setVideo("");
      setAuthor("");
      setImageFile(null);
    } catch (e) {
      setMsg(e.message || "Could not submit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-xl font-bold mb-4">Share your recipe</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <Input label="Title" value={title} onChange={setTitle} />
        <Input label="Your Name" value={author} onChange={setAuthor} />
        <TextArea
          label="Ingredients (comma separated)"
          value={ingredients}
          onChange={setIngredients}
          rows={3}
        />
        <TextArea
          label="Steps (one per line)"
          value={steps}
          onChange={setSteps}
          rows={5}
        />
        <Input label="Video URL (optional)" value={video} onChange={setVideo} />
        <FileInput label="Cover Image (optional)" onFile={setImageFile} />
      </div>

      <button
        onClick={onSubmit}
        className="mt-5 px-5 py-2 rounded-xl bg-pink-600 text-white hover:bg-pink-700 shadow disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "Submitting…" : "Submit Recipe"}
      </button>
      {msg && <p className="mt-3 text-sm">{msg}</p>}
    </div>
  );
}

/** =========================
 *   Feed
 * ========================= */
function Feed() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [sort, setSort] = useState("latest"); // latest | top
  const [q, setQ] = useState("");

  // Mock people online (chat presence)
  const [onlineMap, setOnlineMap] = useState({}); // {username: true/false}

  // Load feed (try backend -> else mock)
  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setErr("");
        let data = null;

        // If you add this endpoint, it will be used:
        // GET /community-feed
        try {
          const res = await fetch(`${API_BASE}/community-feed`);
          if (res.ok) data = await res.json();
        } catch {
          // ignore network error
        }

        if (!data) {
          // Fallback: mock feed
          data = {
            posts: [
              {
                id: "1",
                title: "Chettinad Egg Curry",
                author: "Anu",
                avatar: "https://i.pravatar.cc/100?img=5",
                image:
                  "https://images.unsplash.com/photo-1604908554029-ecf8e6a4a79a?q=80&w=1600&auto=format&fit=crop",
                likes: 42,
                rating: 4.5,
                comments: [
                  { user: "Vikram", text: "Tried it. Mind blowing 🔥" },
                  { user: "Priya", text: "Lovely flavor balance!" },
                ],
                createdAt: new Date().toISOString(),
              },
              {
                id: "2",
                title: "Protein Power Salad",
                author: "Ravi",
                avatar: "https://i.pravatar.cc/100?img=12",
                image:
                  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1600&auto=format&fit=crop",
                likes: 28,
                rating: 4.2,
                comments: [],
                createdAt: new Date(Date.now() - 86400000).toISOString(),
              },
            ],
          };
        }

        setFeed(data.posts || []);
        // Random online presence
        const om = {};
        (data.posts || []).forEach((p) => (om[p.author] = Math.random() > 0.5));
        setOnlineMap(om);
      } catch (e) {
        setErr(e.message || "Failed to load feed");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const filtered = useMemo(() => {
    let list = [...feed];
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(needle) ||
          p.author.toLowerCase().includes(needle)
      );
    }
    switch (sort) {
      case "top":
        list.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      default:
        list.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
    return list;
  }, [feed, sort, q]);

  return (
    <div>
      {/* Controls */}
      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search recipes or cooks…"
          className="border rounded-xl px-4 py-2"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="border rounded-xl px-4 py-2"
        >
          <option value="latest">Latest</option>
          <option value="top">Top</option>
        </select>
      </div>

      {/* Feed grid */}
      {loading ? (
        <FeedSkeleton />
      ) : err ? (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">{err}</div>
      ) : filtered.length === 0 ? (
        <EmptyState text="No recipes yet. Be the first to post!" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              online={!!onlineMap[post.author]}
              onFeedUpdate={(updater) => setFeed((prev) => prev.map((p) => (p.id === post.id ? updater(p) : p)))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** =========================
 *   Post Card
 * ========================= */
function PostCard({ post, online, onFeedUpdate }) {
  const [like, setLike] = useState(post.likes || 0);
  const [rating, setRating] = useState(post.rating || 0);
  const [comments, setComments] = useState(post.comments || []);
  const [followed, setFollowed] = useState(false);
  const [openChat, setOpenChat] = useState(false);
  const [chatStage, setChatStage] = useState("request"); // request | active | denied

  const addLike = async () => {
    setLike((v) => v + 1);
    onFeedUpdate((p) => ({ ...p, likes: (p.likes || 0) + 1 }));
    // Optionally call: POST /community-like
  };

  const submitRating = async (value) => {
    setRating(value);
    onFeedUpdate((p) => ({ ...p, rating: value }));
    try {
      await fetch(`${API_BASE}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipe_title: post.title,
          user: "You",
          rating: value,
          review: "Great!",
        }),
      });
    } catch {
      // ignore
    }
  };

  const addComment = async (text) => {
    if (!text.trim()) return;
    const next = [...comments, { user: "You", text }];
    setComments(next);
    onFeedUpdate((p) => ({ ...p, comments: next }));
    // Optionally: POST /community-comment
  };

  const follow = async () => {
    setFollowed(true);
    // Optionally: POST /follow
  };

  const onChatRequest = () => {
    setOpenChat(true);
    setChatStage("request");
  };

  const onAccept = () => setChatStage("active");
  const onDeny = () => setChatStage("denied");

  return (
    <motion.div
      className="bg-white rounded-2xl shadow hover:shadow-xl transition-shadow overflow-hidden border border-gray-100"
      whileHover={{ y: -3 }}
    >
      <div className="relative">
        <img
          src={
            post.image ||
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80"
          }
          alt={post.title}
          className="w-full h-44 object-cover"
        />
        <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/50 text-white px-3 py-1 rounded-full text-xs">
          <img src={post.avatar} alt="" className="w-5 h-5 rounded-full" />
          <span>{post.author}</span>
          <span className={`ml-2 w-2 h-2 rounded-full ${online ? "bg-green-400" : "bg-gray-400"}`} />
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold">{post.title}</h3>

        <div className="mt-2 flex items-center gap-2">
          <button onClick={addLike} className="px-3 py-1 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100">
            ❤️ {like}
          </button>
          <StarRating value={rating} onChange={submitRating} />
          <button
            onClick={follow}
            className={`ml-auto px-3 py-1 rounded-full ${followed ? "bg-gray-100" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}
          >
            {followed ? "Following ✓" : "Follow"}
          </button>
        </div>

        {/* Comments */}
        <Comments comments={comments} onAdd={addComment} />

        {/* Chat */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={onChatRequest}
            className="flex-1 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            disabled={!online}
            title={online ? "Request chat" : "User offline"}
          >
            💬 Chat
          </button>
          <button className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">Share</button>
        </div>
      </div>

      {/* Chat Modal */}
      <ChatModal
        open={openChat}
        onClose={() => setOpenChat(false)}
        author={post.author}
        stage={chatStage}
        onAccept={onAccept}
        onDeny={onDeny}
      />
    </motion.div>
  );
}

/** =========================
 *   Comments
 * ========================= */
function Comments({ comments, onAdd }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-sm text-gray-600 hover:text-gray-800"
      >
        {open ? "Hide" : "Show"} comments ({comments.length})
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="mt-2 space-y-2"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            {comments.map((c, i) => (
              <div key={i} className="text-sm bg-gray-50 rounded-lg px-3 py-2">
                <span className="font-medium">{c.user}: </span>
                <span>{c.text}</span>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Add a comment"
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={() => {
                  onAdd(text);
                  setText("");
                }}
                className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm"
              >
                Post
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** =========================
 *   Star Rating
 * ========================= */
function StarRating({ value = 0, onChange }) {
  const stars = [1, 2, 3, 4, 5];
  const click = (v) => onChange && onChange(v);

  return (
    <div className="flex items-center">
      {stars.map((s) => (
        <button
          key={s}
          onClick={() => click(s)}
          className="text-xl"
          title={`${s} star`}
        >
          <span className={s <= value ? "text-yellow-400" : "text-gray-300"}>★</span>
        </button>
      ))}
      <span className="text-xs text-gray-500 ml-2">{value.toFixed(1)}</span>
    </div>
  );
}

/** =========================
 *   Chat Modal
 * ========================= */
function ChatModal({ open, onClose, author, stage, onAccept, onDeny }) {
  const [messages, setMessages] = useState([
    { from: author, text: "Hi! Ready to chat about the recipe?" },
  ]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!open) {
      setMessages([{ from: author, text: "Hi! Ready to chat about the recipe?" }]);
      setText("");
    }
  }, [open, author]);

  if (!open) return null;

  const send = () => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { from: "You", text }]);
    setText("");
    // TODO: connect to real-time socket
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <motion.div
          className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
        >
          <div className="px-6 py-5 border-b flex items-center justify-between">
            <h3 className="text-xl font-bold">Chat with {author}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-black">
              ✕
            </button>
          </div>

          {/* Request / Accept / Deny */}
          {stage === "request" && (
            <div className="px-6 py-5">
              <p>{author} is online. Send a chat request?</p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={onAccept}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Send Request
                </button>
                <button
                  onClick={onDeny}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {stage === "denied" && (
            <div className="px-6 py-10 text-center">
              <div className="text-5xl mb-2">😔</div>
              <p>Request denied or timed out.</p>
            </div>
          )}

          {stage === "active" && (
            <div className="flex flex-col h-[420px]">
              <div className="flex-1 overflow-auto p-4 space-y-2">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                      m.from === "You"
                        ? "ml-auto bg-blue-600 text-white"
                        : "bg-gray-100"
                    }`}
                  >
                    <span className="block text-[11px] opacity-70 mb-0.5">
                      {m.from}
                    </span>
                    {m.text}
                  </div>
                ))}
              </div>
              <div className="p-3 border-t flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message"
                  className="flex-1 border rounded-lg px-3 py-2"
                />
                <button
                  onClick={send}
                  className="px-4 py-2 rounded-lg bg-gray-900 text-white"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

/** =========================
 *   Messages (inbox placeholder)
 * ========================= */
function Messages() {
  return (
    <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-600">
      <div className="text-6xl mb-2">💬</div>
      <p>Your chats will appear here once you connect a real-time backend (WebSocket/Supabase/Ably/Pusher).</p>
    </div>
  );
}

/** =========================
 *   Following (list placeholder)
 * ========================= */
function Following() {
  const [list] = useState([
    { name: "Anu", avatar: "https://i.pravatar.cc/100?img=5" },
    { name: "Ravi", avatar: "https://i.pravatar.cc/100?img=12" },
  ]);

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h3 className="text-lg font-semibold mb-4">You’re following</h3>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {list.map((u, i) => (
          <div key={i} className="p-4 rounded-xl border flex items-center gap-3">
            <img src={u.avatar} alt="" className="w-10 h-10 rounded-full" />
            <div>
              <div className="font-semibold">{u.name}</div>
              <button className="text-xs text-gray-500 hover:text-gray-800">View Profile</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** =========================
 *   Small UI Helpers
 * ========================= */
function Input({ label, value, onChange }) {
  return (
    <label className="text-sm">
      <span className="block text-gray-600 mb-1">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-lg px-3 py-2"
      />
    </label>
  );
}

function TextArea({ label, value, onChange, rows = 4 }) {
  return (
    <label className="text-sm">
      <span className="block text-gray-600 mb-1">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full border rounded-lg px-3 py-2"
      />
    </label>
  );
}

function FileInput({ label, onFile }) {
  const [preview, setPreview] = useState("");
  return (
    <label className="text-sm">
      <span className="block text-gray-600 mb-1">{label}</span>
      <input
        type="file"
        accept="image/*,video/*"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            onFile && onFile(f);
            const url = URL.createObjectURL(f);
            setPreview(url);
          }
        }}
        className="w-full border rounded-lg px-3 py-2"
      />
      {preview && (
        <img
          src={preview}
          alt="preview"
          className="mt-2 w-40 h-28 object-cover rounded-lg border"
        />
      )}
    </label>
  );
}

function FeedSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow p-4 animate-pulse">
          <div className="h-44 bg-gray-200 rounded-xl mb-4" />
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text = "Nothing here yet." }) {
  return (
    <div className="text-center text-gray-600 py-20">
      <div className="text-6xl mb-3">🍳</div>
      <p>{text}</p>
    </div>
  );
}
