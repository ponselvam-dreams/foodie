import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Community from "./pages/Community";
import RecipeList from "./pages/RecipeList";
import RecipeDetail from "./pages/RecipeDetail";
import About from "./pages/About";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import MealPlanner from "./pages/MealPlanner";
import Nutrition from "./pages/Nutrition";
import Workshops from "./pages/Workshops";


function App() {
  return (
    <Router>
      <div className="bg-gray-100 min-h-screen">
        <Navbar />
        <div className="container mx-auto p-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/recipes" element={<RecipeList />} />
            <Route path="/recipes/:id" element={<RecipeDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/community" element={<Community />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/meal-planner" element={<MealPlanner />} />
            <Route path="/nutrition" element={<Nutrition />} />
            <Route path="/workshops" element={<Workshops />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
