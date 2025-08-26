import React from "react";

export default function Banner() {
  return (
    <section className="relative w-full h-[600px] flex items-center justify-center bg-gray-900 text-white mb-16">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80"
          alt="Food Banner"
          className="w-full h-full object-cover opacity-70"
        />
        {/* Dark Overlay for text readability */}
        <div className="absolute inset-0 bg-black opacity-50"></div>
      </div>

      {/* Banner Content */}
      <div className="relative z-10 max-w-3xl text-center px-6">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-snug drop-shadow-lg">
          Cook Smarter with AI 👨‍🍳
        </h1>
        <p className="text-lg md:text-2xl mb-8 text-gray-200 leading-relaxed">
          Upload a photo of your ingredients or tell us your mood, <br />
          and let our AI Master Chef suggest delicious recipes tailored just for you.
        </p>
        <a
          href="#upload-section"
          className="inline-block px-8 py-3 bg-green-500 hover:bg-green-600 rounded-full text-lg font-semibold shadow-lg transition-transform transform hover:scale-105"
        >
          🍽️ Get Started
        </a>
      </div>
    </section>
  );
}
