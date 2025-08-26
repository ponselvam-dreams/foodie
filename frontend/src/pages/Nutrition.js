import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Nutrition() {
  const [ingredients, setIngredients] = useState("");
  const [nutrition, setNutrition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const analyze = async () => {
    try {
      setLoading(true);
      setErr("");

      const res = await fetch("http://127.0.0.1:8000/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: ingredients
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });

      if (!res.ok) throw new Error(`Failed: ${res.status}`);

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setNutrition(data);
    } catch (e) {
      setErr(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex flex-col items-center py-10 px-6">
      {/* 🔥 Header */}
      <motion.h1
        className="text-4xl md:text-5xl font-extrabold mb-8 text-center bg-gradient-to-r from-green-600 to-lime-500 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        🥦 Nutrition Analyzer
      </motion.h1>

      {/* Input Box */}
      <motion.textarea
        value={ingredients}
        onChange={(e) => setIngredients(e.target.value)}
        placeholder="Enter ingredients (comma separated)"
        className="w-full max-w-2xl border-2 border-green-300 rounded-lg p-4 shadow focus:ring-4 focus:ring-green-200 focus:outline-none"
        rows={3}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
      />

      {/* Analyze Button */}
      <motion.button
        onClick={analyze}
        className="mt-5 px-6 py-3 bg-gradient-to-r from-green-600 to-lime-500 text-white font-semibold rounded-full shadow-lg hover:scale-105 transition-transform"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={loading}
      >
        {loading ? "⏳ Analyzing..." : "🚀 Analyze"}
      </motion.button>

      {err && <p className="mt-3 text-red-600">{err}</p>}

      {/* Results */}
      <AnimatePresence>
        {nutrition && (
          <motion.div
            className="mt-10 w-full max-w-3xl bg-white rounded-2xl shadow-xl p-8"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-green-700 mb-6">
              Your Nutrition Report
            </h2>

            {/* Macros with progress bars */}
            <div className="space-y-4">
              <MacroBar
                label="Calories"
                value={nutrition.calories}
                max={2000}
                color="bg-red-400"
              />
              <MacroBar
                label="Protein"
                value={nutrition.protein}
                max={100}
                color="bg-blue-500"
              />
              <MacroBar
                label="Carbs"
                value={nutrition.carbs}
                max={300}
                color="bg-yellow-400"
              />
              <MacroBar
                label="Fat"
                value={nutrition.fat}
                max={100}
                color="bg-pink-500"
              />
            </div>

            {/* Vitamins */}
            <div className="mt-6">
              <h3 className="font-semibold text-lg mb-2">💊 Vitamins</h3>
              <div className="flex flex-wrap gap-2">
                {nutrition.vitamins.map((v, i) => (
                  <motion.span
                    key={i}
                    className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium shadow"
                    whileHover={{ scale: 1.1 }}
                  >
                    {v}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 🔥 Reusable MacroBar Component
function MacroBar({ label, value, max, color }) {
  const percent = Math.min((value / max) * 100, 100);

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className={`h-3 rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>
    </div>
  );
}
