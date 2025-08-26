import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = "http://127.0.0.1:8000";

export default function Workshops() {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [mode, setMode] = useState("all"); // all | online | offline
  const [sort, setSort] = useState("relevance"); // relevance | price_asc | price_desc | date_asc | date_desc
  const [selected, setSelected] = useState(null); // for modal

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(`${API_BASE}/workshops`);
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const data = await res.json();
        setWorkshops(data.workshops || []);
      } catch (e) {
        setErr(e.message || "Could not load workshops");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const filtered = useMemo(() => {
    let list = [...workshops];

    // search
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter(
        (w) =>
          w.title?.toLowerCase().includes(needle) ||
          w.host?.toLowerCase().includes(needle)
      );
    }

    // mode filter
    if (mode !== "all") {
      list = list.filter((w) => (w.mode || "").toLowerCase() === mode);
    }

    // sort
    const byPrice = (a, b) => (a.price || 0) - (b.price || 0);
    const byDate = (a, b) => new Date(a.date) - new Date(b.date);
    switch (sort) {
      case "price_asc":
        list.sort(byPrice);
        break;
      case "price_desc":
        list.sort((a, b) => -byPrice(a, b));
        break;
      case "date_asc":
        list.sort(byDate);
        break;
      case "date_desc":
        list.sort((a, b) => -byDate(a, b));
        break;
      default:
        // relevance = API order
        break;
    }
    return list;
  }, [workshops, q, mode, sort]);

  return (
    <div className="min-h-[70vh]">
      {/* ===== Hero ===== */}
      <motion.div
        className="relative overflow-hidden rounded-3xl mb-10"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* animated gradient bg */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-green-500 via-emerald-500 to-blue-500"
          style={{ backgroundSize: "200% 200%" }}
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
        {/* subtle pattern overlay */}
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,.6) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        />

        {/* content */}
        <div className="relative px-6 md:px-10 py-12 text-white">
          <motion.h1
            className="text-3xl md:text-4xl font-extrabold tracking-tight"
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.45 }}
          >
            👩‍🍳 Cooking Workshops
          </motion.h1>
          <motion.p
            className="mt-2 text-white/90 max-w-2xl"
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.45 }}
          >
            Learn from experts & home cooks. Hands-on sessions, real recipes, real skills.
          </motion.p>

          {/* controls */}
          <motion.div
            className="mt-6 grid sm:grid-cols-3 gap-3"
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.45 }}
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title or host…"
              className="w-full rounded-xl px-4 py-2 bg-white/90 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/60"
            />
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full rounded-xl px-4 py-2 bg-white/90 text-gray-800 focus:outline-none focus:ring-2 focus:ring-white/60"
            >
              <option value="all">All Modes</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full rounded-xl px-4 py-2 bg-white/90 text-gray-800 focus:outline-none focus:ring-2 focus:ring-white/60"
            >
              <option value="relevance">Sort: Relevance</option>
              <option value="price_asc">Sort: Price (Low → High)</option>
              <option value="price_desc">Sort: Price (High → Low)</option>
              <option value="date_asc">Sort: Date (Sooner first)</option>
              <option value="date_desc">Sort: Date (Later first)</option>
            </select>
          </motion.div>
        </div>
      </motion.div>

      {/* Error */}
      {err && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
          {err}
        </div>
      )}

      {/* ===== Grid ===== */}
      {loading ? (
        <SkeletonGrid />
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <AnimatedGrid>
          {filtered.map((w, idx) => (
            <WorkshopCard key={`${w.title}-${idx}`} w={w} onJoin={() => setSelected(w)} />
          ))}
        </AnimatedGrid>
      )}

      {/* ===== Modal ===== */}
      <JoinModal
        open={!!selected}
        onClose={() => setSelected(null)}
        workshop={selected}
      />
    </div>
  );
}

/* ==================== Sub-Components ==================== */

function AnimatedGrid({ children }) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.05 },
    },
  };
  const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.28 } },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {React.Children.map(children, (child, i) => (
        <motion.div variants={item}>{child}</motion.div>
      ))}
    </motion.div>
  );
}

function WorkshopCard({ w, onJoin }) {
  const sampleImages = [
    "https://images.unsplash.com/photo-1514517220032-58469dbad9d7?q=80&w=1600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?q=80&w=1600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1600&auto=format&fit=crop",
  ];
  const img = sampleImages[Math.floor(Math.random() * sampleImages.length)];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative bg-white rounded-2xl shadow hover:shadow-2xl transition-shadow overflow-hidden border border-gray-100"
    >
      {/* Glow border on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          boxShadow:
            "0 0 0 2px rgba(16,185,129,0.25), 0 10px 30px rgba(16,185,129,0.15)",
        }}
      />

      <div className="relative">
        <motion.img
          src={img}
          alt={w.title}
          className="w-full h-44 object-cover"
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.35 }}
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge>
            {w.mode?.toLowerCase() === "online" ? "💻 Online" : "📍 Offline"}
          </Badge>
        </div>
        <div className="absolute top-3 right-3">
          <Badge>₹{w.price}</Badge>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold">{w.title}</h3>
        <p className="text-sm text-gray-600">Host: {w.host}</p>
        <p className="text-xs text-gray-500 mt-1">Date: {w.date}</p>

        <div className="mt-4 flex gap-2">
          <button
            onClick={onJoin}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow"
          >
            Join
          </button>
          <button className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
            Save
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function Badge({ children }) {
  return (
    <span className="px-2 py-1 text-xs rounded-full bg-black/60 text-white backdrop-blur">
      {children}
    </span>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="relative bg-white rounded-2xl shadow p-4 overflow-hidden"
        >
          <div className="h-44 w-full rounded-xl bg-gray-200 overflow-hidden">
            <Shimmer />
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4 overflow-hidden">
              <Shimmer />
            </div>
            <div className="h-3 bg-gray-200 rounded w-1/2 overflow-hidden">
              <Shimmer />
            </div>
            <div className="h-3 bg-gray-200 rounded w-1/3 overflow-hidden">
              <Shimmer />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Shimmer() {
  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_1.2s_infinite]"/>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      className="text-center text-gray-600 py-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="text-6xl mb-3">🧑‍🍳</div>
      <p>No workshops found. Try changing filters or search.</p>
    </motion.div>
  );
}

function JoinModal({ open, onClose, workshop }) {
  const [success, setSuccess] = useState(false);
  if (!open || !workshop) return null;

  const handleConfirm = () => {
    // TODO: POST to /workshops/join if you add it
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <motion.div
          className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
        >
          <div className="px-6 py-5 border-b flex items-center justify-between">
            <h3 className="text-xl font-bold">Join Workshop</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-black">✕</button>
          </div>

          <div className="px-6 py-5">
            {success ? (
              <motion.div
                className="text-center py-8"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <div className="text-5xl mb-3">🎉</div>
                <p className="text-lg font-semibold">You're in!</p>
                <p className="text-gray-600 mt-1">
                  We'll email you the details shortly.
                </p>
              </motion.div>
            ) : (
              <>
                <p className="text-gray-700">
                  <span className="font-semibold">{workshop.title}</span> by{" "}
                  <span className="font-medium">{workshop.host}</span>
                </p>
                <p className="text-gray-600 mt-1">
                  Date: {workshop.date} •{" "}
                  {workshop.mode === "online" ? "Online" : "Offline"}
                </p>
                <p className="text-green-700 font-semibold mt-2">
                  Price: ₹{workshop.price}
                </p>

                <div className="mt-5 flex gap-3">
                  <motion.button
                    onClick={handleConfirm}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow"
                    whileTap={{ scale: 0.98 }}
                  >
                    Confirm
                  </motion.button>
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
