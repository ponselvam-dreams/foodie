import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-white/80 shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 font-extrabold text-xl text-green-600">
          🍳 FoodieAI
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
            beta
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-700">
          <Link to="/" className="hover:text-green-600">Home</Link>
          <Link to="/community" className="hover:text-green-600">Community</Link>
          <Link to="/about" className="hover:text-green-600">About</Link>
          <Link to="/meal-planner" className="hover:text-green-600">Meal Planner</Link>
          <Link to="/nutrition" className="hover:text-green-600">Nutrition</Link>
          <Link to="/workshops" className="hover:text-green-600">Workshops</Link>
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-1.5 rounded-lg border border-green-600 text-green-600 hover:bg-green-50 text-sm font-medium"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="px-4 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm font-medium"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}
