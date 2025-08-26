import React from "react";

export default function RecipeModal({ open, onClose, recipe }) {
  if (!open || !recipe) return null;

  const title = recipe.title || "Recipe";
  const steps = recipe.steps || recipe.topSteps || [];
  const image = recipe.image;
  const videos = recipe.video_suggestions || recipe.videos || [];

  // --- helpers ---
  const stepText = (s) => (typeof s === "string" ? s : s?.step || "");
  const stepMeta = (s) => {
    if (typeof s === "string") return "";
    const time = s?.time ? `⏱ ${s.time}` : "";
    const tools =
      Array.isArray(s?.tools) && s.tools.length ? `🛠 ${s.tools.join(", ")}` : "";
    return [time, tools].filter(Boolean).join(" • ");
  };

  const speakAll = () => {
    const lines = steps.map((s, i) => {
      const base = stepText(s) || `Step ${i + 1}`;
      const meta = stepMeta(s);
      return meta ? `${base}. ${meta}` : base;
    });
    const text = [title, ...lines].join(". ");
    const u = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Centered modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h3 className="text-xl font-bold">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-black text-lg"
            >
              ✕
            </button>
          </div>

          {/* Image */}
          {image && (
            <img
              src={image}
              alt={title}
              className="w-full h-56 object-cover"
            />
          )}

          {/* Steps */}
          <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
            <ol className="list-decimal ml-6 space-y-3 text-gray-800">
              {steps.map((s, i) => (
                <li key={i}>
                  <div className="font-medium">{stepText(s)}</div>
                  {stepMeta(s) && (
                    <div className="text-xs text-gray-500">{stepMeta(s)}</div>
                  )}
                </li>
              ))}
            </ol>

            {/* Optional Videos */}
            {Array.isArray(videos) && videos.length > 0 && (
              <div className="mt-6">
                <h4 className="text-md font-semibold mb-2">🎬 Video Tutorials</h4>
                <div className="flex flex-wrap gap-3">
                  {videos.map((v, i) => (
                    <a
                      key={i}
                      href={v}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                    >
                      📹 Watch Video {i + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={speakAll}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow"
              >
                🔊 Start Cooking
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
