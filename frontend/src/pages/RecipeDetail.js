import { useParams } from "react-router-dom";

export default function RecipeDetail() {
  const { id } = useParams();

  // Sample details
  const recipe = {
    id,
    name: "Pasta Primavera",
    steps: [
      "Boil pasta in salted water.",
      "Saute vegetables in olive oil.",
      "Mix pasta with veggies.",
      "Add herbs & serve hot."
    ],
  };

  const speakStep = (step) => {
    const utter = new SpeechSynthesisUtterance(step);
    speechSynthesis.speak(utter);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">{recipe.name} 🍝</h1>
      <ul className="mt-4 space-y-3">
        {recipe.steps.map((step, index) => (
          <li key={index} className="flex justify-between items-center bg-gray-100 p-3 rounded-lg">
            {step}
            <button onClick={() => speakStep(step)} className="bg-green-600 text-white px-3 py-1 rounded-lg">
              🔊
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
