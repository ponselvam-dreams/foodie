from fastapi import APIRouter

router = APIRouter(prefix="", tags=["Workshops"])

@router.get("/workshops")
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