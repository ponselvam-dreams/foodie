import React, { useState } from "react";

export default function RecipeResultCard({ recipe, fallbackMood = "Any", onSpeak }) {
  const title = recipe.title || "Recipe";
  const image =
    recipe.image ||
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80";
  const ready = recipe.readyInMinutes || recipe.time || 20;
  const mood = recipe.mood || fallbackMood;
  const steps = recipe.steps || recipe.topSteps || [];
  const tagline = recipe.tagline || recipe.description || "";
  const videos = recipe.video_suggestions || recipe.videos || [];

  const [saved, setSaved] = useState(false);

  // --- helpers ---
  const stepText = (s) => (typeof s === "string" ? s : s?.step || "");
  const stepMeta = (s) => {
    if (typeof s === "string") return "";
    const time = s?.time ? `⏱ ${s.time}` : "";
    const tools =
      Array.isArray(s?.tools) && s.tools.length ? `🛠 ${s.tools.join(", ")}` : "";
    const pieces = [time, tools].filter(Boolean);
    return pieces.length ? pieces.join(" • ") : "";
  };

  const speakFirstSteps = () => {
    // Build a natural sentence: Title. Step 1 (with time). Step 2...
    const first = steps.slice(0, 3).map((s, i) => {
      const base = stepText(s) || `Step ${i + 1}`;
      const meta = stepMeta(s);
      return meta ? `${base}. ${meta}` : base;
    });
    const text = [title, ...first].join(". ");
    if (onSpeak) onSpeak(text);
    else {
      const u = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-shadow duration-300 overflow-hidden border border-gray-100">
      {/* Image */}
      <div className="relative">
        <img
          src={image}
          alt={title}
          className="w-full h-44 object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <button
          onClick={() => setSaved(!saved)}
          className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-medium shadow"
          title="Save"
        >
          {saved ? "💚 Saved" : "🤍 Save"}
        </button>
        <div className="absolute inset-x-0 bottom-0 p-3 flex gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-black/60 text-white">
            ⏱️ {ready} min
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-black/60 text-white">
            😊 {mood}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {tagline && <p className="text-sm text-gray-600 mt-1">{tagline}</p>}

        {/* Steps preview */}
        {!!steps.length && (
          <ul className="text-sm text-gray-700 list-disc ml-5 mt-3 space-y-1">
            {steps.slice(0, 3).map((s, i) => (
              <li key={i}>
                <span className="font-medium">{stepText(s)}</span>
                {stepMeta(s) && (
                  <div className="text-xs text-gray-500">{stepMeta(s)}</div>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Optional video links */}
        {Array.isArray(videos) && videos.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {videos.slice(0, 2).map((v, i) => (
              <a
                key={i}
                href={v}
                target="_blank"
                rel="noreferrer"
                className="text-xs px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200"
              >
                🎬 Video {i + 1}
              </a>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={speakFirstSteps}
            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm shadow"
          >
            🔊 Listen
          </button>
          <button
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
            title="Open full recipe (wire later)"
          >
            📖 View
          </button>
        </div>
      </div>
    </div>
  );
}
