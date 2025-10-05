import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = "http://127.0.0.1:8000";

/** =========================
 *   Community Page (Container)
 * ========================= */
export default function Community() {
  const [tab, setTab] = useState("feed"); // feed | submit | messages | following

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <TopNavbar />
      
      {/* Main Layout: Sidebar, Content, Leaderboard/Profile */}
      <div className="flex max-w-7xl mx-auto pt-6 px-4 gap-8">
        <div className="hidden lg:block w-56 flex-shrink-0">
          <Sidebar tab={tab} setTab={setTab} />
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <Header />
          
          {/* Tabs for mobile/small screens, and controlling main content */}
          <div className="lg:hidden mb-6 bg-white rounded-xl p-2 shadow flex gap-2">
            <Tab label="Feed" active={tab === "feed"} onClick={() => setTab("feed")} />
            <Tab label="Submit" active={tab === "submit"} onClick={() => setTab("submit")} />
            <Tab label="Messages" active={tab === "messages"} onClick={() => setTab("messages")} />
            <Tab label="Following" active={tab === "following"} onClick={() => setTab("following")} />
          </div>

          {tab === "feed" && <DiscussionFeed />}
          {tab === "submit" && <SubmitDiscussion />}
          {tab === "messages" && <Messages />}
          {tab === "following" && <Following />}
        </div>

        <div className="hidden lg:block w-72 flex-shrink-0 space-y-6">
          <UserProfileCard />
          <Leaderboard />
        </div>
      </div>
    </div>
  );
}

/** =========================
 *   REPLACED: Top Navigation Bar
 * ========================= */
function TopNavbar() {
  return (
    <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="text-2xl font-bold text-gray-900">Campfire</div>
          <div className="relative flex-1 hidden md:block">
            <input
              type="text"
              placeholder="Search for topics and discussions"
              className="w-96 pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-gray-500 hover:text-gray-700 w-8 h-8 rounded-full flex items-center justify-center border">
            <span className="text-xl">+</span>
          </button>
          <img src="https://i.pravatar.cc/100?img=4" alt="user" className="w-8 h-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** =========================
 *   NEW: Left Sidebar
 * ========================= */
function Sidebar({ tab, setTab }) {
    const items = [
        { label: "Explore", icon: "🧭" },
        { label: "Feed", icon: "📝", state: "feed" },
        { label: "Notifications", icon: "🔔", badge: 10 },
        { label: "Members", icon: "👥" },
        { label: "My profile", icon: "👤" },
    ];
    const secondaryItems = [
        { label: "Discussions", icon: "💬" },
        { label: "Articles", icon: "📰" },
        { label: "Events", icon: "📅" },
        { label: "Groups", icon: "🔗" },
        { label: "Wishlist", icon: "⭐" },
    ];
    const helpItems = [
        { label: "Help center", icon: "❓" },
        { label: "Resources", icon: "📚" },
        { label: "Roadmap", icon: "🗺️" },
        { label: "Changelog", icon: "🛠️" },
    ];

    const allItems = [...items, {separator: true}, ...secondaryItems, {separator: true}, ...helpItems];

    return (
        <nav className="text-sm space-y-1">
            {allItems.map((item, index) => (
                item.separator ? (
                    <div key={index} className="h-4" />
                ) : (
                    <button
                        key={item.label}
                        onClick={() => item.state && setTab(item.state)}
                        className={`flex items-center w-full px-4 py-2 rounded-lg transition-colors ${
                            item.label === "Discussions" || (item.state && item.state === tab)
                                ? "bg-indigo-50 text-indigo-700 font-semibold"
                                : "text-gray-600 hover:bg-gray-100"
                        }`}
                    >
                        <span className="mr-3">{item.icon}</span>
                        {item.label}
                        {item.badge && (
                            <span className="ml-auto bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                                {item.badge}
                            </span>
                        )}
                    </button>
                )
            ))}
            {/* Added a button for the 'Submit' feature */}
            <button
                onClick={() => setTab("submit")}
                className={`flex items-center w-full px-4 py-2 rounded-lg transition-colors ${
                    tab === "submit" ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-gray-600 hover:bg-gray-100"
                } mt-4 border-t pt-4`}
            >
                <span className="mr-3">✍️</span> Submit New Topic
            </button>
        </nav>
    );
}


/** =========================
 *   Header (REVISED)
 *   This header is now hidden on large screens since the sidebar takes over navigation
 * ========================= */
function Header() {
  return (
    <div className="lg:hidden relative overflow-hidden rounded-2xl mb-8 bg-white shadow">
      <div className="relative px-6 py-6 text-gray-900">
        <h1 className="text-2xl font-bold tracking-tight">
          Discussion Feed
        </h1>
        <p className="mt-1 text-gray-500 text-sm">
          Share, learn, and discuss product success and community building.
        </p>
      </div>
    </div>
  );
}


/** =========================
 *   Submit Discussion (REPLACED SubmitRecipe)
 * ========================= */
function SubmitDiscussion() {
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState(""); // Replaced ingredients
  const [body, setBody] = useState(""); // Replaced steps
  const [author, setAuthor] = useState("Angel");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    try {
      setLoading(true);
      setMsg("");

      // 1) Send metadata to /community-post (MOCK API CALL)
      const res = await fetch(`${API_BASE}/community-post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
          body,
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

      if (!ok) throw new Error(data?.error || `Failed: ${res.status}`);
      setMsg(data.message || "Discussion posted successfully! 💬");
      setTitle("");
      setTags("");
      setBody("");
    } catch (e) {
      setMsg(e.message || "Could not submit discussion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-xl font-bold mb-4">Start a new discussion topic</h2>
      <div className="grid md:grid-cols-1 gap-4">
        <Input label="Topic Title" value={title} onChange={setTitle} />
        <Input label="Tags (comma separated, e.g., SaaS, marketing)" value={tags} onChange={setTags} />
        <TextArea
          label="Discussion Body (Detail your question or thoughts)"
          value={body}
          onChange={setBody}
          rows={8}
        />
        <Input label="Author Name" value={author} onChange={setAuthor} />
      </div>

      <button
        onClick={onSubmit}
        className="mt-5 px-5 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "Posting…" : "Post Discussion"}
      </button>
      {msg && <p className="mt-3 text-sm text-green-700">{msg}</p>}
    </div>
  );
}

/** =========================
 *   Discussion Feed (REPLACED Feed)
 * ========================= */
function DiscussionFeed() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [sort, setSort] = useState("latest"); // latest | top | comments
  const [q, setQ] = useState("");

  // Mock Data
  const MOCK_POSTS = [
    {
      id: "1",
      title: "Customer Success: What It Means & Why It Matters",
      author: "Keerthi",
      avatar: "https://i.pravatar.cc/100?img=5",
      tag: "Best Practice",
      likes: 23,
      commentsCount: 15,
      daysAgo: 4,
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      comments: [
        { user: "Thomas L.", text: "Engage with your potential and existing customers by regularly posting updates...", isBest: true },
      ],
    },
    {
      id: "2",
      title: "How to build a community for your SaaS? 🧑‍💻",
      author: "Angel",
      avatar: "https://i.pravatar.cc/100?img=12",
      tag: "SaaS",
      likes: 48,
      commentsCount: 21,
      daysAgo: 5,
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      comments: [
        { user: "Angel", text: "We started out building our platform by working with entrepreneurs.", isAuthor: true },
      ],
    },
  ];

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
          data = { posts: MOCK_POSTS };
        }

        setFeed(data.posts || []);
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
      case "comments":
        list.sort((a, b) => (b.commentsCount || 0) - (a.commentsCount || 0));
        break;
      default: // latest
        list.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
    return list;
  }, [feed, sort, q]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="hidden lg:flex justify-end gap-3 items-center">
        {/* We keep this here for demonstration, but typically the search bar is in the top navbar */}
        {/* <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search topics…"
          className="border rounded-xl px-4 py-2"
        /> */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="border rounded-xl px-4 py-2 text-sm"
        >
          <option value="latest">Newest first</option>
          <option value="top">Top likes</option>
          <option value="comments">Most comments</option>
        </select>
      </div>

      {/* Feed list */}
      {loading ? (
        <FeedSkeleton />
      ) : err ? (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">{err}</div>
      ) : filtered.length === 0 ? (
        <EmptyState text="No discussions yet. Start a new topic!" />
      ) : (
        <div className="space-y-6">
          {filtered.map((post) => (
            <DiscussionPostCard
              key={post.id}
              post={post}
              onFeedUpdate={(updater) => setFeed((prev) => prev.map((p) => (p.id === post.id ? updater(p) : p)))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** =========================
 *   Discussion Post Card (REPLACED PostCard)
 * ========================= */
function DiscussionPostCard({ post }) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [like, setLike] = useState(post.likes || 0);

  const addLike = () => {
    setLike((v) => v + 1);
    // Optionally call: POST /community-like
  };
    
  // Use mock comments for display (since we don't have a real comments endpoint)
  const mockComments = post.comments || [];

  return (
    <div className="bg-white rounded-xl shadow p-6 border border-gray-100 space-y-4">
      
      {/* Post Header (Author/Time) */}
      <div className="flex items-center gap-3">
        <img src={post.avatar} alt={post.author} className="w-10 h-10 rounded-full" />
        <div>
          <div className="font-semibold text-gray-900">{post.author}</div>
          <div className="text-xs text-gray-500">{post.daysAgo} days ago</div>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold hover:text-indigo-600 cursor-pointer">{post.title}</h3>

      {/* Action Bar */}
      <div className="flex items-center gap-6 text-sm text-gray-600">
        <button onClick={addLike} className="flex items-center gap-1 hover:text-red-500">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          <span className="font-medium">{like}</span>
        </button>
        
        <button onClick={() => setCommentsOpen(v => !v)} className="flex items-center gap-1 hover:text-indigo-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
          <span className="font-medium">{post.commentsCount || 0}</span>
        </button>

        <button className="text-gray-400 hover:text-gray-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M5 14l6-6 6 6z"/></svg>
        </button>

        <button className="text-gray-400 hover:text-gray-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 10c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm0 4c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm0-8c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm4 8h12v-2H10v2zm0 4h12v-2H10v2zm0-8h12v-2H10v2z"/></svg>
        </button>
      </div>
      
      {/* Comments Section (Based on image) */}
      <AnimatePresence>
        {commentsOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-4 border-t border-gray-100"
          >
            <div className="flex justify-between items-center text-sm mb-4">
              <span className="font-semibold">{post.commentsCount} Comments</span>
              <div className="flex gap-4">
                <button className="font-medium text-indigo-600">Top comments</button>
                <button className="text-gray-600 hover:text-indigo-600">Newest first</button>
              </div>
            </div>

            <div className="space-y-4">
              {mockComments.map((c, i) => (
                <Comment key={i} comment={c} author={post.author} />
              ))}
            </div>

            <div className="mt-4">
              <input 
                placeholder="Write a reply..."
                className="w-full border rounded-lg px-4 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** =========================
 *   NEW: Comment Component
 * ========================= */
function Comment({ comment, author }) {
    const isAuthor = comment.user === author || comment.isAuthor;

    return (
        <div className="flex gap-3">
            <img src={comment.user === "Thomas L." ? "https://i.pravatar.cc/100?img=1" : "https://i.pravatar.cc/100?img=12"} alt={comment.user} className="w-8 h-8 rounded-full mt-1" />
            <div className="flex-1">
                <div className="flex items-center gap-2 text-sm mb-1">
                    <span className="font-semibold">{comment.user}</span>
                    {comment.isBest && <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">Best Answer</span>}
                    {isAuthor && <span className="text-xs font-medium text-gray-500">Author</span>}
                    <span className="text-xs text-gray-500">8d</span>
                </div>
                <p className="text-sm text-gray-800">{comment.text}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <button className="flex items-center gap-1 hover:text-indigo-600">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                        <span>{isAuthor ? 43 : 12}</span>
                    </button>
                    <button className="hover:text-indigo-600">Reply</button>
                    <button className="hover:text-indigo-600">...</button>
                </div>
            </div>
        </div>
    );
}

/** =========================
 *   NEW: User Profile Card (Right Sidebar)
 * ========================= */
function UserProfileCard() {
    return (
        <div className="bg-white rounded-2xl overflow-hidden shadow">
            <div className="relative h-24 bg-cover bg-center" style={{backgroundImage: "url('https://images.unsplash.com/photo-1549416177-3199c0724810?auto=format&fit=crop&q=80&w=600&h=150')"}}>
                <img 
                    src="https://i.pravatar.cc/100?img=4" 
                    alt="Soheil Alavi" 
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-16 h-16 rounded-full border-4 border-white object-cover"
                />
            </div>
            <div className="text-center pt-10 pb-4 px-4 space-y-1">
                <h3 className="font-bold text-lg">Soheil Alavi</h3>
                <p className="text-sm text-gray-500">Chief Product Officer @ Tribe</p>
                <span className="inline-block px-3 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-full mt-2">Admin</span>
            </div>
            <div className="p-4 border-t bg-gray-50 text-center text-sm text-indigo-600 hover:bg-gray-100 cursor-pointer">
                View Profile
            </div>
        </div>
    );
}

/** =========================
 *   NEW: Leaderboard (Right Sidebar)
 * ========================= */
function Leaderboard() {
    const [timeframe, setTimeframe] = useState('This Week');
    const leaders = [
        { name: "Yew Li", score: 550, avatar: "https://i.pravatar.cc/100?img=17" },
        { name: "Claudia", score: 550, avatar: "https://i.pravatar.cc/100?img=33" },
        { name: "Adrian", score: 397, avatar: "https://i.pravatar.cc/100?img=30" },
        { name: "Soheil", score: 347, avatar: "https://i.pravatar.cc/100?img=4" },
        { name: "Siavash", score: 325, avatar: "https://i.pravatar.cc/100?img=25" },
        { name: "Nadia", score: 284, avatar: "https://i.pravatar.cc/100?img=34" },
        { name: "Kamran", score: 249, avatar: "https://i.pravatar.cc/100?img=6" },
        { name: "Nick", score: 118, avatar: "https://i.pravatar.cc/100?img=14" },
        { name: "Jason", score: 118, avatar: "https://i.pravatar.cc/100?img=3" },
    ];

    return (
        <div className="bg-white rounded-2xl shadow p-5 space-y-4">
            <h4 className="font-bold text-lg">Leaderboard</h4>
            <div className="flex gap-2 text-sm border-b pb-2">
                {['This Week', 'This Month', 'All Time'].map(t => (
                    <button 
                        key={t}
                        onClick={() => setTimeframe(t)}
                        className={`px-3 py-1 rounded-full font-medium transition-colors ${
                            timeframe === t ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'
                        }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            <div className="space-y-3">
                {leaders.slice(0, 9).map((leader, index) => (
                    <div key={index} className={`flex items-center justify-between text-sm ${index < 3 ? 'p-2 rounded-lg bg-gray-50' : ''}`}>
                        <div className="flex items-center gap-3">
                            <span className={`w-6 text-center font-bold ${index < 3 ? 'text-indigo-600' : 'text-gray-500'}`}>{index + 1}</span>
                            <img src={leader.avatar} alt={leader.name} className="w-8 h-8 rounded-full" />
                            <span className="font-medium">{leader.name}</span>
                        </div>
                        <span className="font-semibold text-gray-700">{leader.score}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}


// The following helper components were kept from your original file:
// Tab, Input, TextArea, FeedSkeleton, EmptyState, Messages, Following
// NOTE: I removed StarRating and ChatModal as they were not relevant to the new UI.

/** =========================
 *   UI Helpers (kept from original)
 * ========================= */
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

function FeedSkeleton() {
    return (
        <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow p-6 animate-pulse space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                        <div className="space-y-1">
                            <div className="h-4 bg-gray-200 rounded w-20"></div>
                            <div className="h-3 bg-gray-200 rounded w-16"></div>
                        </div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-4/5"></div>
                    <div className="flex items-center gap-6 pt-2 border-t border-gray-100">
                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmptyState({ text = "Nothing here yet." }) {
    return (
        <div className="text-center text-gray-600 py-20">
            <div className="text-6xl mb-3">💬</div>
            <p>{text}</p>
        </div>
    );
}

function Messages() {
  return (
    <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-600">
      <div className="text-6xl mb-2">💬</div>
      <p>Your chats will appear here once you connect a real-time backend.</p>
    </div>
  );
}

function Following() {
  const [list] = useState([
    { name: "Angel", avatar: "https://i.pravatar.cc/100?img=12" },
    { name: "Keerthi", avatar: "https://i.pravatar.cc/100?img=5" },
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

// NOTE: ChatModal and StarRating were removed as they did not fit the new design.