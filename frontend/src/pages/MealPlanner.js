import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = "http://127.0.0.1:8000";

export default function MealPlanner() {
  // —— Inputs ——
  const [heightCm, setHeightCm] = useState(170);
  const [weightKg, setWeightKg] = useState(70);
  const [age, setAge] = useState(28);
  const [sex, setSex] = useState("male"); // male | female
  const [activity, setActivity] = useState("moderate"); // sedentary, light, moderate, active
  const [goal, setGoal] = useState("lose"); // lose | maintain | gain
  const [pref, setPref] = useState("auto"); // auto | Veg | Non-Veg | Vegan
  const [mealsPerDay, setMealsPerDay] = useState(3);

  // —— Derived ——
  const bmi = useMemo(() => {
    const m = heightCm / 100;
    return +(weightKg / (m * m)).toFixed(1);
  }, [heightCm, weightKg]);

  const activityMultiplier = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
  }[activity];

  const bmr = useMemo(() => {
    // Mifflin–St Jeor (rough estimate)
    const base =
      sex === "male"
        ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
        : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    return Math.round(base);
  }, [heightCm, weightKg, age, sex]);

  const tdee = useMemo(() => Math.round(bmr * activityMultiplier), [bmr, activityMultiplier]);

  const calorieTarget = useMemo(() => {
    if (goal === "lose") return Math.max(tdee - 500, 1200);
    if (goal === "gain") return tdee + 300;
    return tdee;
  }, [tdee, goal]);

  const suggestedDiet = useMemo(() => {
    if (pref !== "auto") return pref;
    // Simple heuristic:
    // - lose: Veg (or Vegan if user prefers later)
    // - gain: Non-Veg (or protein-rich Veg if user toggles)
    // - maintain: Veg by default
    if (goal === "gain") return "Non-Veg";
    if (goal === "lose") return "Veg";
    return "Veg";
  }, [pref, goal]);

  // —— State ——
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [streak, setStreak] = useState(0);
  const [chefOpen, setChefOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);

  // —— Streaks (localStorage) ——
  useEffect(() => {
    const last = localStorage.getItem("mp_lastDay");
    const count = parseInt(localStorage.getItem("mp_streak") || "0", 10);
    const today = new Date().toDateString();
    if (last === today) {
      setStreak(count);
    } else {
      // do nothing yet; will update on Generate
      setStreak(count);
    }
  }, []);

  const bumpStreak = () => {
    const today = new Date().toDateString();
    const last = localStorage.getItem("mp_lastDay");
    let next = parseInt(localStorage.getItem("mp_streak") || "0", 10);

    if (last === today) {
      // same day regenerate -> keep streak
    } else {
      // new day
      next = next + 1;
      localStorage.setItem("mp_lastDay", today);
      localStorage.setItem("mp_streak", String(next));
    }
    setStreak(next);
  };

  // —— Generate Plan ——
  const generatePlan = async () => {
    try {
      setErr("");
      setLoading(true);
      setPlan(null);

      const res = await fetch(`${API_BASE}/mealplan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diet: suggestedDiet,
          calories: calorieTarget,
          meals_per_day: mealsPerDay,
        }),
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setPlan(data);
      bumpStreak();
    } catch (e) {
      setErr(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // —— Shopping list (aggregate) ——
  const shoppingList = useMemo(() => {
    const bag = {};
    if (!plan?.days) return [];
    plan.days.forEach((d) => {
      d.meals?.forEach((m) => {
        (m.ingredients || []).forEach((ing) => {
          const key = ing.toLowerCase();
          bag[key] = (bag[key] || 0) + 1; // naive count
        });
      });
    });
    return Object.entries(bag).map(([name, count]) => ({ name, count }));
  }, [plan]);

  const copyPlan = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(plan, null, 2));
      alert("Plan copied to clipboard ✅");
    } catch {
      alert("Copy failed");
    }
  };

  return (
    <div className="min-h-screen">
      {/* HERO */}
      <motion.div
        className="relative overflow-hidden rounded-3xl mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-green-500 to-lime-500"
          style={{ backgroundSize: "200% 200%" }}
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
        <div className="relative px-6 md:px-10 py-10 text-white">
          <motion.h1
            className="text-3xl md:text-4xl font-extrabold tracking-tight"
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            🧭 Smart Meal Planner
          </motion.h1>
          <motion.p
            className="mt-2 text-white/90 max-w-2xl"
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Personalized plan from your height, weight, activity & goals. We’ll
            auto-suggest calories and Veg/Non-Veg. (General guidance, not medical advice.)
          </motion.p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Badge>🔥 Goal: {goal}</Badge>
            <Badge>💪 Activity: {activity}</Badge>
            <Badge>🥗 Diet: {suggestedDiet}</Badge>
            <Badge>🍽️ Meals/day: {mealsPerDay}</Badge>
          </div>
        </div>
      </motion.div>

      {/* INPUTS + KPIs */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Inputs Card */}
        <motion.div
          className="bg-white rounded-2xl shadow p-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-lg font-semibold mb-4">Your Profile</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <NumberInput label="Height (cm)" value={heightCm} setValue={setHeightCm} />
            <NumberInput label="Weight (kg)" value={weightKg} setValue={setWeightKg} />
            <NumberInput label="Age" value={age} setValue={setAge} />
            <Select label="Sex" value={sex} setValue={setSex} options={["male", "female"]} />
            <Select
              label="Activity"
              value={activity}
              setValue={setActivity}
              options={["sedentary", "light", "moderate", "active"]}
            />
            <Select label="Goal" value={goal} setValue={setGoal} options={["lose", "maintain", "gain"]} />
            <Select label="Diet" value={pref} setValue={setPref} options={["auto", "Veg", "Non-Veg", "Vegan"]} />
            <NumberInput label="Meals per day" value={mealsPerDay} setValue={setMealsPerDay} min={2} max={6} />
          </div>

          <button
            onClick={generatePlan}
            className="mt-5 w-full px-4 py-3 rounded-xl text-white font-semibold bg-green-600 hover:bg-green-700 shadow disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Generating…" : "Generate Weekly Plan"}
          </button>

          {err && <p className="mt-3 text-red-600">{err}</p>}

          <div className="mt-4 text-xs text-gray-500">
            Disclaimer: This is general wellness guidance. Consult a healthcare professional for personalized advice.
          </div>
        </motion.div>

        {/* KPI Card */}
        <motion.div
          className="bg-white rounded-2xl shadow p-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-lg font-semibold mb-4">Your Stats</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <KPI title="BMI" value={bmi} hint={bmiHint(bmi)} />
            <KPI title="BMR" value={`${bmr} kcal`} hint="Basal metabolic rate" />
            <KPI title="TDEE" value={`${tdee} kcal`} hint="Maintenance calories" />
            <KPI title="Target" value={`${calorieTarget} kcal`} hint={`${goal} goal`} />
            <KPI title="Diet" value={suggestedDiet} hint="Auto-suggested" />
            <StreakBadge streak={streak} />
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setChefOpen(true)}
              className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow"
            >
              👨‍🍳 Contact Chef
            </button>
            <button
              onClick={() => setCoachOpen(true)}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow"
            >
              🏋️ Contact Coach
            </button>
          </div>
        </motion.div>
      </div>

      {/* PLAN & SHOPPING LIST */}
      <AnimatePresence>
        {plan && (
          <motion.div
            className="mt-10 grid lg:grid-cols-3 gap-8"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            {/* Plan */}
            <div className="lg:col-span-2">
              <SectionTitle>📅 Weekly Plan</SectionTitle>
              <div className="grid md:grid-cols-2 gap-6">
                {plan.days?.map((d, i) => (
                  <motion.div
                    key={i}
                    className="bg-white rounded-2xl shadow p-5"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <h4 className="font-semibold mb-3">{d.day}</h4>
                    <ul className="space-y-2">
                      {d.meals?.map((m, j) => (
                        <li key={j} className="text-sm">
                          <span className="font-medium">{m.title}</span>
                          {m.ingredients?.length ? (
                            <span className="text-gray-500"> — {m.ingredients.join(", ")}</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={copyPlan}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                >
                  📋 Copy Plan JSON
                </button>
              </div>
            </div>

            {/* Shopping List */}
            <div>
              <SectionTitle>🛒 Shopping List</SectionTitle>
              <div className="bg-white rounded-2xl shadow p-5">
                {shoppingList.length ? (
                  <ul className="space-y-2">
                    {shoppingList.map((it, k) => (
                      <li key={k} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{it.name}</span>
                        <span className="text-gray-500">x{it.count}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">Generate a plan to see your shopping list.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <ContactModal
        open={chefOpen}
        onClose={() => setChefOpen(false)}
        title="Talk to a Chef"
        subtitle="Get a custom menu, substitutions & prep tips"
      />
      <ContactModal
        open={coachOpen}
        onClose={() => setCoachOpen(false)}
        title="Talk to a Coach"
        subtitle="Weight loss/gain tips, macros & habit plan"
      />
    </div>
  );
}

/* ============= UI Bits ============= */

function NumberInput({ label, value, setValue, min, max }) {
  return (
    <label className="text-sm">
      <span className="block text-gray-600 mb-1">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full border rounded-lg px-3 py-2"
      />
    </label>
  );
}

function Select({ label, value, setValue, options }) {
  return (
    <label className="text-sm">
      <span className="block text-gray-600 mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full border rounded-lg px-3 py-2"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function KPI({ title, value, hint }) {
  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white border">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
      {hint && <div className="text-xs text-gray-500 mt-1">{hint}</div>}
    </div>
  );
}

function StreakBadge({ streak }) {
  return (
    <motion.div
      className="p-4 rounded-xl bg-yellow-50 border"
      animate={{ scale: [1, 1.04, 1] }}
      transition={{ repeat: Infinity, duration: 3 }}
    >
      <div className="text-xs text-yellow-700">Streak</div>
      <div className="text-2xl font-extrabold text-yellow-700">🔥 {streak}d</div>
      <div className="text-xs text-yellow-700/80">Consecutive days planned</div>
    </motion.div>
  );
}

function Badge({ children }) {
  return (
    <span className="px-2.5 py-1 text-xs rounded-full bg-black/20 text-white backdrop-blur">
      {children}
    </span>
  );
}

function SectionTitle({ children }) {
  return <h3 className="text-lg font-semibold mb-3">{children}</h3>;
}

function ContactModal({ open, onClose, title, subtitle }) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  if (!open) return null;

  const submit = async () => {
    // TODO: call your backend to create a lead (/workshops/join or /contact)
    setSent(true);
    setTimeout(() => {
      setSent(false);
      onClose();
    }, 1200);
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
          <div className="px-6 py-5 border-b">
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          </div>
          <div className="px-6 py-5 space-y-3">
            {sent ? (
              <motion.div
                className="text-center py-8"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <div className="text-5xl mb-3">🎉</div>
                <p className="font-semibold">Request sent</p>
                <p className="text-gray-600">We’ll get back to you soon.</p>
              </motion.div>
            ) : (
              <>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full border rounded-lg px-3 py-2"
                />
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Email or phone"
                  className="w-full border rounded-lg px-3 py-2"
                />
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What do you need help with?"
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                />
                <div className="flex gap-3">
                  <button
                    onClick={submit}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Send
                  </button>
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

/* ============= helpers ============= */

function bmiHint(bmi) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy";
  if (bmi < 30) return "Overweight";
  return "Obese";
}
