import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function LandingBanner() {
  const floatingIcons = ["🍅", "🥚", "🥦", "🍗", "🍝", "🥬", "🧄", "🥒"];

  return (
    <section className="relative w-full h-[90vh] flex items-center justify-center bg-gradient-to-br from-green-50 to-green-200 overflow-hidden">
      {/* Floating Food Emojis */}
      {floatingIcons.map((icon, i) => (
        <motion.div
          key={i}
          className="absolute text-6xl select-none"
          initial={{ y: Math.random() * 800, opacity: 0 }}
          animate={{ y: [0, -100, 0], opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 8 + Math.random() * 5,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
        >
          {icon}
        </motion.div>
      ))}

      {/* Content */}
      <div className="relative z-10 text-center max-w-3xl px-6">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-snug drop-shadow-lg">
          Cook Smarter with <span className="text-green-600">AI</span> 👨‍🍳
        </h1>
        <p className="text-lg md:text-xl text-gray-700 mb-8 leading-relaxed">
          Upload your fridge or tell us your mood.  
          FoodieAI will suggest delicious, step-by-step recipes.
        </p>
        <Link
          to="/#upload-section"
          className="px-8 py-3 bg-green-600 hover:bg-green-700 rounded-full text-lg font-semibold text-white shadow-lg transition-transform transform hover:scale-105"
        >
          📸 Upload & Discover Recipes
        </Link>
      </div>
    </section>
  );
}
