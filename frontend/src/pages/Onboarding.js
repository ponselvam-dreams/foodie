import React, { useState } from "react";

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    language: "English",
    diet: "Veg",
    region: "South Indian",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleSubmit = () => {
    console.log("Onboarding complete:", form);
    if (onComplete) onComplete(form);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-200 p-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Welcome 👋</h1>
            <p className="mb-4 text-gray-600">Sign up to get started</p>
            <input
              name="name"
              placeholder="Name"
              value={form.name}
              onChange={handleChange}
              className="w-full mb-3 px-4 py-2 border rounded-lg"
            />
            <input
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="w-full mb-3 px-4 py-2 border rounded-lg"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="w-full mb-3 px-4 py-2 border rounded-lg"
            />

            <button
              onClick={nextStep}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
            >
              Continue →
            </button>

            <button
              onClick={handleSubmit}
              className="mt-3 w-full bg-gray-100 py-2 rounded-lg hover:bg-gray-200"
            >
              🚀 Explore without signup
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Preferences 🧑‍🍳</h1>

            <label className="block text-sm font-medium">Language</label>
            <select
              name="language"
              value={form.language}
              onChange={handleChange}
              className="w-full mb-4 px-4 py-2 border rounded-lg"
            >
              <option>English</option>
              <option>Tamil</option>
              <option>Hindi</option>
            </select>

            <label className="block text-sm font-medium">Dietary Preference</label>
            <select
              name="diet"
              value={form.diet}
              onChange={handleChange}
              className="w-full mb-4 px-4 py-2 border rounded-lg"
            >
              <option>Veg</option>
              <option>Non-Veg</option>
              <option>Vegan</option>
            </select>

            <label className="block text-sm font-medium">Region</label>
            <select
              name="region"
              value={form.region}
              onChange={handleChange}
              className="w-full mb-6 px-4 py-2 border rounded-lg"
            >
              <option>South Indian</option>
              <option>North Indian</option>
              <option>Global</option>
            </select>

            <div className="flex justify-between">
              <button
                onClick={prevStep}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Finish ✅
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
