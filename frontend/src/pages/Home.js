import { useState, useRef, useEffect } from "react";
import Navbar from "../components/Navbar";
import LandingBanner from "../components/LandingBanner"; // Keep this graphical banner
import MoodSelector from "../components/MoodSelector";
import UploadDropzone from "../components/UploadDropzone";
import RecipeResultCard from "../components/RecipeResultCard";
import SkeletonCard from "../components/SkeletonCard";
import RecipeModal from "../components/RecipeModal";
import FindRecipeBanner from "../components/findRecipeBanner"; // Keep this graphical banner

export default function Home() {
  const [mood, setMood] = useState("Happy"); // default mood
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [ingredientsText, setIngredientsText] = useState("");
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");

  const imageFileRef = useRef({ files: [] });
  const recognitionRef = useRef(null);

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
  const getSuggestions = async (overrideIngredients) => {
    setErr("");
    const payloadIngredients = overrideIngredients ?? ingredientsText;
    if (!payloadIngredients.trim()) {
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
          ingredients: payloadIngredients
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

  // --- Voice Assistant (Web Speech API) Setup ---
  useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) {
      recognitionRef.current = null;
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      setListening(true);
      setInterim("");
    };

    recognition.onerror = (e) => {
      console.error("Speech recognition error:", e);
      setErr("Voice assistant error. Try again.");
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      setInterim("");
    };

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const res = event.results[i];
        if (res.isFinal) finalTranscript += res[0].transcript;
        else interimTranscript += res[0].transcript;
      }
      setInterim(interimTranscript);
      if (finalTranscript) {
        setTranscript((t) => (t ? t + " " + finalTranscript : finalTranscript));
        handleVoiceCommand(finalTranscript.trim().toLowerCase());
      }
    };

    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.stop();
      } catch {}
      recognitionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleListening = () => {
    const rec = recognitionRef.current;
    if (!rec) {
      setErr("Voice not supported in this browser.");
      return;
    }
    if (listening) {
      try {
        rec.stop();
        setListening(false);
      } catch {}
    } else {
      try {
        setTranscript("");
        rec.start();
      } catch (e) {
        console.error(e);
        setErr("Could not start voice assistant.");
      }
    }
  };

  const handleVoiceCommand = (text) => {
    if (!text) return;
    setErr("");

    if (/^(stop listening|stop)$/.test(text)) {
      const rec = recognitionRef.current;
      try {
        rec?.stop();
      } catch {}
      setListening(false);
      return;
    }
    if (/^(start listening|start)$/.test(text)) {
      const rec = recognitionRef.current;
      try {
        rec?.start();
      } catch {}
      return;
    }

    const moodMatch =
      text.match(/(?:i am|i'm|im|mood)\s+(feeling\s+)?([a-zA-Z]+)/) ||
      text.match(/^(happy|sad|excited|angry|tired|hungry|satisfied|craving)/);
    if (moodMatch) {
      const word = moodMatch[2] || moodMatch[1] || moodMatch[0];
      if (word) {
        const newMood = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        setMood(newMood);
      }
    }

    const ingMatch = text.match(
      /(?:ingredients|ingredient|i have|i've got|i got|i have got)\s+(.+)/
    );
    if (ingMatch && ingMatch[1]) {
      let raw = ingMatch[1].replace(/ and /g, ",");
      raw = raw.replace(/\bplease\b|\bnow\b/g, "");
      setIngredientsText(raw.trim());
      setTimeout(() => getSuggestions(raw.trim()), 100);
      return;
    }

    if (/(find|detect|what is this|what's this|identify)\s+(recipe|food|dish)?/.test(text)) {
      findRecipeFromImage();
      return;
    }

    const openMatch = text.match(/open (?:recipe )?(\w+)/);
    if (openMatch && openMatch[1]) {
      const numWord = openMatch[1];
      let idx = parseInt(numWord, 10);
      if (isNaN(idx)) {
        const map = {
          one: 1, two: 2, three: 3, four: 4, five: 5,
          six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
        };
        idx = map[numWord.toLowerCase()] || NaN;
      }
      if (!isNaN(idx) && recipes.length >= idx && idx > 0) {
        setActiveRecipe(recipes[idx - 1]);
        setOpenModal(true);
      } else {
        setErr("Recipe index out of range.");
      }
      return;
    }

    if (/(close (?:recipe|modal)|dismiss)/.test(text)) {
      setOpenModal(false);
      return;
    }

    const maybeList = text.split(/,| and |;/).filter(Boolean);
    if (maybeList.length >= 2 && maybeList.every((w) => w.trim().length > 0)) {
      const candidate = maybeList.join(", ");
      setIngredientsText(candidate);
      setTimeout(() => getSuggestions(candidate), 100);
      return;
    }

    setErr(`Heard: "${text}" — no actionable command recognized.`);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans"> {/* Added font-sans for corporate look */}
      {/* 🔝 Navbar */}
      <Navbar />

      {/* 🔥 Hero Banner - Retained and slightly enhanced */}
      <div className="mb-16"> {/* Increased bottom margin */}
        <LandingBanner />
      </div>

      {/* 🥘 Find Recipe Banner - Retained */}
      <div
        id="upload-section"
        className="container mx-auto px-6 pb-12 flex justify-center" // Wider padding, increased pb
      >
        <FindRecipeBanner />
      </div>

      {/* Content Section - Main Interaction Area */}
      <div className="container mx-auto px-6 pb-16 flex justify-center">
        <div className="w-full max-w-7xl bg-white rounded-3xl shadow-2xl p-12 transition-all duration-300 ease-in-out"> {/* Increased max-w, shadow, padding */}
          
          {/* Voice Assistant Section - Elevated for a premium feel */}
          <div className="mb-12 p-8 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl shadow-inner flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left flex-grow">
              <h3 className="text-3xl font-extrabold text-indigo-800 mb-2 leading-tight">
                <span className="bg-indigo-600 text-white rounded-full px-3 py-1 text-base inline-block mr-2 -mt-1">NEW</span> Voice Command Interface
              </h3>
              <p className="text-base text-gray-700 max-w-2xl mx-auto md:mx-0">
                Enhance your experience with hands-free recipe discovery. Simply click the mic and speak commands naturally.
                <br />
                <span className="font-semibold italic">Examples: "I'm feeling hungry", "ingredients egg, tomato", "find recipe"</span>
              </p>
            </div>
            <div className="flex-shrink-0 flex flex-col sm:flex-row items-center gap-5">
              <button
                onClick={toggleListening}
                className={`px-8 py-4 rounded-full shadow-lg transition-all duration-300 text-lg font-bold ${
                  listening ? "bg-red-600 hover:bg-red-700 text-white animate-pulse" : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {listening ? "🔴 Stop Listening" : "🎙️ Start Voice Assistant"}
              </button>
              <div className="text-sm border-l-2 border-indigo-300 pl-5 min-w-[180px]">
                <div className="font-semibold text-gray-800 mb-1">Live Transcript:</div>
                <div className="max-w-xs truncate text-gray-600 h-5">
                  {interim ? interim : transcript ? transcript : <span className="text-gray-400">Awaiting input...</span>}
                </div>
              </div>
            </div>
          </div>

          {err && <p className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-base rounded">{err}</p>}

          {/* Upload + Manual Input - Enhanced Two-Column Layout */}
          <div className="grid md:grid-cols-2 gap-16 items-start"> {/* Increased gap, aligned items to start */}
            
            {/* Left Column: Upload Dish */}
            <div className="pr-8 border-r border-gray-200"> {/* Added right border */}
              <h3 className="text-2xl font-bold mb-6 text-gray-800">1. Analyze Your Dish Image</h3>
              <UploadDropzone
                onFileSelected={(f) => {
                  imageFileRef.current = { files: [f] };
                  setImagePreview(URL.createObjectURL(f));
                }}
              />
              {imagePreview && (
                <div className="mt-8 p-3 border border-gray-200 rounded-xl bg-gray-50">
                  <img
                    src={imagePreview}
                    alt="Uploaded dish preview"
                    className="w-full max-h-80 object-cover rounded-lg shadow-md mx-auto"
                  />
                </div>
              )}
              <button
                onClick={findRecipeFromImage}
                className="mt-8 w-full bg-indigo-600 text-white text-xl font-semibold py-4 rounded-xl shadow-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "🔍 Detecting Recipe..." : "🚀 Find Recipe from Image"}
              </button>
            </div>

            {/* Right Column: Mood & Ingredients */}
            <div className="pl-8"> {/* Added left padding */}
              <h3 className="text-2xl font-bold mb-6 text-gray-800">2. Describe Your Culinary Needs</h3>
              
              {/* Mood Selector */}
              <div className="mb-10 p-6 bg-blue-50 border border-blue-200 rounded-xl">
                <h4 className="font-semibold text-xl text-blue-800 mb-4">A. How are you feeling today?</h4>
                <MoodSelector value={mood} onChange={setMood} />
              </div>

              {/* Enter Ingredients (text input) */}
              <div className="p-6 bg-green-50 border border-green-200 rounded-xl">
                <h4 className="font-semibold text-xl text-green-800 mb-4">B. What ingredients do you have?</h4>
                <input
                  className="w-full border-2 border-gray-300 focus:border-green-500 rounded-lg px-4 py-3 text-lg transition-colors focus:ring-2 focus:ring-green-200"
                  placeholder="e.g., chicken breast, fresh basil, heavy cream, spaghetti"
                  value={ingredientsText}
                  onChange={(e) => setIngredientsText(e.target.value)}
                />
                <button
                  onClick={() => getSuggestions()}
                  className="mt-6 w-full bg-green-600 text-white text-xl font-semibold py-4 rounded-xl shadow-lg hover:bg-green-700 transition-colors disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? "Finding Suggestions..." : "✨ Get Smart Recipe Suggestions"}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ✨ Recipe Suggestions Section */}
      <div className="container mx-auto px-6 pb-20"> {/* Wider padding, increased pb */}
        <div className="w-full max-w-7xl mx-auto"> {/* Max width for consistency */}
          <div className="mb-10 pt-10 border-t border-gray-200"> {/* Clear separator */}
            <h2 className="text-4xl font-extrabold text-gray-800 mb-3 text-center">
              Your Personalized Recipe Suggestions
            </h2>
            <p className="text-xl text-gray-600 text-center">
              Curated intelligently based on your inputs and a <span className="font-bold text-indigo-600">{mood}</span> culinary preference.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"> {/* Increased gap, added xl col */}
            {loading ? (
              [...Array(8)].map((_, i) => <SkeletonCard key={i} />) // More skeleton cards
            ) : recipes.length ? (
              recipes.map((r, i) => (
                <div
                  key={i}
                  className="cursor-pointer group hover:scale-105 transition-transform duration-200 ease-in-out" // Added hover effect
                  onClick={() => {
                    setActiveRecipe(r);
                    setOpenModal(true);
                  }}
                >
                  <RecipeResultCard recipe={r} fallbackMood={mood} />
                </div>
              ))
            ) : (
              <p className="text-gray-500 col-span-full text-center p-12 bg-gray-100 border-2 border-dashed border-gray-300 rounded-2xl text-lg shadow-inner">
                No recipes yet. Leverage our AI tools above to effortlessly discover new culinary possibilities.
              </p>
            )}
          </div>
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