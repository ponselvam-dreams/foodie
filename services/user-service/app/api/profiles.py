from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.profile import get_profile_by_user_id, create_profile, update_profile, delete_profile, UserProfile
from app.schemas import UserProfileCreate, UserProfileOut

router = APIRouter()


@router.post("/", response_model=UserProfileOut, status_code=201)
def create_user_profile(payload: UserProfileCreate, db: Session = Depends(get_db)):
    existing = get_profile_by_user_id(db, payload.user_id)
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists for user")
    profile = create_profile(db, **payload.model_dump())
    return profile


@router.get("/user/{user_id}", response_model=UserProfileOut)
def get_profile(user_id: int, db: Session = Depends(get_db)):
    profile = get_profile_by_user_id(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.put("/user/{user_id}", response_model=UserProfileOut)
def update_user_profile(user_id: int, payload: UserProfileCreate, db: Session = Depends(get_db)):
    profile = get_profile_by_user_id(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    profile = update_profile(db, profile, **payload.model_dump())
    return profile


@router.delete("/user/{user_id}")
def delete_user_profile(user_id: int, db: Session = Depends(get_db)):
    profile = get_profile_by_user_id(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    delete_profile(db, profile)
    return {"message": "profile deleted"}
