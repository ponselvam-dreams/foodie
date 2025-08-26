import { useState, useRef } from "react";
import Navbar from "../components/Navbar";
import LandingBanner from "../components/LandingBanner";
import MoodSelector from "../components/MoodSelector";
import UploadDropzone from "../components/UploadDropzone";
import RecipeResultCard from "../components/RecipeResultCard";
import SkeletonCard from "../components/SkeletonCard";
import RecipeModal from "../components/RecipeModal";
import FindRecipeBanner from "../components/findRecipeBanner";

export default function Home() {
  const [mood, setMood] = useState("Happy"); // default mood
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [ingredientsText, setIngredientsText] = useState("");
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const imageFileRef = useRef({ files: [] });

  // ✅ Call backend /detect for image-only recipe detection
  const findRecipeFromImage = async () => {
    setErr("");
    const file = imageFileRef.current?.files?.[0];
    if (!file) {
      setErr("Please upload an image first.");
      return;
    }

    try {
      setLoading(true);
      const form = new FormData();
      form.append("file", file);
      form.append("mood", mood || "Happy");

      const res = await fetch("http://127.0.0.1:8000/detect", {
        method: "POST",
        body: form,
      });

      if (!res.ok) throw new Error(`Detect failed: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Use recipes list
      if (data.recipes?.length) {
        setRecipes(data.recipes);
        // Also open modal with first recipe
        setActiveRecipe(data.recipes[0]);
        setOpenModal(true);
      } else {
        setErr("No recipe detected. Try another image.");
      }
    } catch (e) {
      setErr(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Call backend /suggest for manual ingredients + mood
  const getSuggestions = async () => {
    setErr("");
    if (!ingredientsText.trim()) {
      setErr("Please enter at least one ingredient.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("http://127.0.0.1:8000/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood,
          ingredients: ingredientsText
            .split(",")
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean),
        }),
      });

      if (!res.ok) throw new Error(`Suggest failed: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setRecipes(data.recipes || []);
    } catch (e) {
      setErr(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 🔝 Navbar */}
      <Navbar />

      {/* 🔥 Hero Banner */}
      <LandingBanner />

      {/* 🥘 Find Recipe Banner */}
      <div
        id="upload-section"
        className="container mx-auto px-4 pb-16 flex justify-center mt-20"
      >
        <FindRecipeBanner />
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 pb-16 flex justify-center">
        <div className="w-full max-w-6xl bg-white rounded-3xl shadow-xl p-10">
          {/* Mood Selector */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">How are you feeling?</h3>
            <MoodSelector value={mood} onChange={setMood} />
          </div>

          {/* Upload + Manual Input */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Upload Image */}
            <div>
              <h3 className="font-semibold mb-3">Upload Your Dish</h3>
              <UploadDropzone
                onFileSelected={(f) => {
                  imageFileRef.current = { files: [f] };
                  setImagePreview(URL.createObjectURL(f));
                }}
              />
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Uploaded"
                  className="mt-4 w-64 rounded-xl shadow mx-auto"
                />
              )}

              {/* ✅ Find the Recipe Button */}
              <button
                onClick={findRecipeFromImage}
                className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg shadow hover:bg-blue-700 disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "🔍 Detecting..." : "🔍 Find the Recipe"}
              </button>
            </div>

            {/* Enter Ingredients (text input) */}
            <div>
              <h3 className="font-semibold mb-3">Enter Ingredients</h3>
              <input
                className="w-full border rounded-lg px-3 py-2"
                placeholder="eg. egg, tomato, onion, rice"
                value={ingredientsText}
                onChange={(e) => setIngredientsText(e.target.value)}
              />
              <button
                onClick={getSuggestions}
                className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg shadow hover:bg-green-700 disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Finding..." : "Get Suggestions"}
              </button>
            </div>
          </div>

          {err && <p className="mt-4 text-red-600">{err}</p>}
        </div>
      </div>

      {/* ✨ Recipe Suggestions */}
      <div className="container mx-auto px-4 pb-16">
        <h2 className="text-3xl font-bold mb-6 text-center">✨ Suggestions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
          ) : recipes.length ? (
            recipes.map((r, i) => (
              <div
                key={i}
                className="cursor-pointer"
                onClick={() => {
                  setActiveRecipe(r);
                  setOpenModal(true);
                }}
              >
                <RecipeResultCard recipe={r} fallbackMood={mood} />
              </div>
            ))
          ) : (
            <p className="text-gray-500 col-span-full text-center">
              No recipes yet. Choose a mood and upload a photo or add ingredients.
            </p>
          )}
        </div>
      </div>

      {/* 📖 Recipe Modal */}
      <RecipeModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        recipe={activeRecipe}
      />
    </div>
  );
}
