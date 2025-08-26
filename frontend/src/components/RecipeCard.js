import { Link } from "react-router-dom";

export default function RecipeCard({ recipe }) {
  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl p-4 transition">
      <img src={recipe.image} alt={recipe.name} className="rounded-xl w-full h-48 object-cover" />
      <h2 className="text-lg font-bold mt-2">{recipe.name}</h2>
      <p className="text-gray-600">{recipe.description}</p>
      <Link to={`/recipes/${recipe.id}`} className="mt-3 inline-block text-green-600 font-semibold">
        View Details →
      </Link>
    </div>
  );
}
