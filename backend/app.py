# app.py
import os, base64, json
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
from community_api import router as community_router

# Load env variables
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)

app = FastAPI(title="FoodieAI Backend", version="1.1")

# Enable frontend calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Types ----------
class SuggestionIn(BaseModel):
    mood: str
    ingredients: List[str] = []

class SubstituteIn(BaseModel):
    ingredient: str
    diet: Optional[str] = None

class MealPlanIn(BaseModel):
    diet: str
    calories: int
    meals_per_day: int = 3

class NutritionIn(BaseModel):
    ingredients: List[str]

class ReviewIn(BaseModel):
    recipe_title: str
    user: str
    rating: int
    review: str

class CommunityPostIn(BaseModel):
    title: str
    ingredients: List[str]
    steps: List[str]
    video_url: Optional[str] = None
    author: str


@app.get("/")
def root():
    return {"message": "Backend is running with AI Chef 🍳"}


# ---------- /suggest ----------
@app.post("/suggest")
def suggest(payload: SuggestionIn):
    mood = payload.mood
    ingredients = ", ".join(payload.ingredients) if payload.ingredients else "any ingredients"

    system_prompt = (
        "You are Master Chef AI 👨‍🍳. "
        "Given a mood and available ingredients, suggest 3 recipes in Tamil language. "
        "Include description, steps (with time & tools), video links, expert, workshop info."
        "Return ONLY JSON in the agreed schema."
    )
    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"My mood is {mood}. I have {ingredients}. Suggest recipes."},
            ],
            temperature=0.7,
        )
        content = resp.choices[0].message.content.strip("` \n")
        if content.startswith("json"): content = content[4:].strip()
        return json.loads(content)
    except Exception as e:
        return {"error": str(e)}


# ---------- /detect ----------
@app.post("/detect")
async def detect(file: UploadFile = File(...), mood: str = Form("Happy")):
    raw = await file.read()
    b64 = base64.b64encode(raw).decode("utf-8")
    data_url = f"data:{file.content_type or 'image/jpeg'};base64,{b64}"

    system_prompt = (
        "You are Master Chef AI 👨‍🍳. "
        "1. Identify visible ingredients in the image. "
        "2. Suggest recipes in Tamil language suitable for given mood. "
        "Include description, steps (with time & tools), video links, expert, workshop info."
        "Return ONLY JSON."
    )
    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": f"My mood is {mood}. Suggest recipes."},
                        {"type": "image_url", "image_url": {"url": data_url}},
                    ],
                },
            ],
        )
        content = resp.choices[0].message.content.strip("` \n")
        if content.startswith("json"): content = content[4:].strip()
        return {"mood": mood, **json.loads(content)}
    except Exception as e:
        return {"error": str(e)}


# ---------- /substitute ----------
@app.post("/substitute")
def substitute(payload: SubstituteIn):
    ingredient = payload.ingredient
    diet = payload.diet or "general"
    system_prompt = (
        "You are a smart ingredient substitution assistant. "
        f"Suggest alternatives for {ingredient} suitable for {diet} diets. "
        "Return JSON { 'substitutes': [str...] }"
    )
    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": system_prompt}],
        )
        content = resp.choices[0].message.content.strip("` \n")
        if content.startswith("json"): content = content[4:].strip()
        return json.loads(content)
    except Exception as e:
        return {"error": str(e)}


# ---------- /mealplan ----------
@app.post("/mealplan")
def mealplan(payload: MealPlanIn):
    system_prompt = (
        f"Create a weekly meal plan for {payload.diet} diet. "
        f"Calories: {payload.calories} per day. {payload.meals_per_day} meals/day. "
        "Return JSON { 'days': [ { 'day': 'Monday', 'meals': [ { 'title': str, 'ingredients': [..] } ] } ] }"
    )
    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": system_prompt}],
        )
        content = resp.choices[0].message.content.strip("` \n")
        if content.startswith("json"): content = content[4:].strip()
        return json.loads(content)
    except Exception as e:
        return {"error": str(e)}


# ---------- /nutrition ----------
@app.post("/nutrition")
def nutrition(payload: NutritionIn):
    items = ", ".join(payload.ingredients)
    system_prompt = (
        f"Analyze nutrition for ingredients: {items}. "
        "Return JSON { 'calories': int, 'protein': int, 'carbs': int, 'fat': int, 'vitamins': [..] }"
    )
    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": system_prompt}],
        )
        content = resp.choices[0].message.content.strip("` \n")
        if content.startswith("json"): content = content[4:].strip()
        return json.loads(content)
    except Exception as e:
        return {"error": str(e)}


# ---------- /review -----------
@app.post("/review")
def review(payload: ReviewIn):
    # Here we’d save to DB; for now, echo back
    return {"message": "Review submitted ✅", "data": payload.dict()}


# ---------- /community-post ----------
@app.post("/community-post")
def community_post(payload: CommunityPostIn):
    # Save to DB later; for now, return mock confirmation
    return {"message": "Recipe shared with community 🍲", "post": payload.dict()}

app.include_router(community_router)

# ---------- /workshops ----------
@app.get("/workshops")
def workshops():
    return {
        "workshops": [
            {
                "title": "Chettinad Chicken Masterclass",
                "host": "Chef Anbu",
                "price": 299,
                "date": "2025-09-01",
                "mode": "online",
            },
            {
                "title": "Vegan Smoothie Hacks",
                "host": "Chef Priya",
                "price": 199,
                "date": "2025-09-05",
                "mode": "offline",
            },
        ]
    }
