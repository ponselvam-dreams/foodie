import RecipeCard from "../components/RecipeCard";

const sampleRecipes = [
  { id: 1, name: "Pasta Primavera", description: "Fresh veggies with pasta", image: "https://plus.unsplash.com/premium_photo-1664472693779-c129e03c1a19?q=80&w=777&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
  { id: 2, name: "Veg Curry", description: "Indian style curry", image: "https://plus.unsplash.com/premium_photo-1700752343880-fa224237af07?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
  { id: 3, name: "Salad Bowl", description: "Healthy and fresh salad", image: "https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
];

export default function RecipeList() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Recipe Suggestions 🍛</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sampleRecipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  );
}
