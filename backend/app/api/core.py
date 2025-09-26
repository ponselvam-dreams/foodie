import base64
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form
from pydantic import BaseModel
from app.services.ai_service import get_openai_client

router = APIRouter(prefix="", tags=["Core AI"])

# ---------- Schemas ----------
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

@router.post("/suggest")
def suggest(payload: SuggestionIn):
    client = get_openai_client()
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
        import json
        return json.loads(content)
    except Exception as e:
        return {"error": str(e)}

@router.post("/detect")
async def detect(file: UploadFile = File(...), mood: str = Form("Happy")):
    client = get_openai_client()
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
        import json
        return {"mood": mood, **json.loads(content)}
    except Exception as e:
        return {"error": str(e)}

@router.post("/substitute")
def substitute(payload: SubstituteIn):
    client = get_openai_client()
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
        import json
        return json.loads(content)
    except Exception as e:
        return {"error": str(e)}

@router.post("/mealplan")
def mealplan(payload: MealPlanIn):
    client = get_openai_client()
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
        import json
        return json.loads(content)
    except Exception as e:
        return {"error": str(e)}

@router.post("/nutrition")
def nutrition(payload: NutritionIn):
    client = get_openai_client()
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
        import json
        return json.loads(content)
    except Exception as e:
        return {"error": str(e)}

@router.post("/review")
def review(payload: ReviewIn):
    # placeholder: could be saved to DB in community router
    return {"message": "Review submitted ✅", "data": payload.dict()}