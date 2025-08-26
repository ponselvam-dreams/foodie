import React from "react";

const MOODS = [
  { key: "Happy", emoji: "😄", desc: "Bright & fun" },
  { key: "Sad", emoji: "🥺", desc: "Comfort food" },
  { key: "Energetic", emoji: "⚡", desc: "Protein boost" },
  { key: "Lazy", emoji: "🛋️", desc: "10–15 mins" },
  { key: "Stressed", emoji: "🧘", desc: "Calming & light" },
];

export default function MoodSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {MOODS.map((m) => {
        const active = value === m.key;
        return (
          <button
            key={m.key}
            onClick={() => onChange(m.key)}
            type="button"
            className={`text-left rounded-xl border px-4 py-3 transition shadow-sm
            ${active ? "border-green-600 bg-green-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
          >
            <div className="text-base font-semibold">{m.emoji} {m.key}</div>
            <div className="text-xs text-gray-500">{m.desc}</div>
          </button>
        );
      })}
    </div>
  );
}
