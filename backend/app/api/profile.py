from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.users import get_by_email, update_user
from app.schemas.user import UserUpdate, UserInDB
from app.core.authentication import get_current_user

router = APIRouter(prefix="/api/v1/profile", tags=["Profile"])


@router.get("/", response_model=UserInDB)
def read_own_profile(current=Depends(get_current_user), db: Session = Depends(get_db)):
    # current is expected to include 'email'
    email = current.get("email") if isinstance(current, dict) else None
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    user = get_by_email(db, email=email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/", response_model=UserInDB)
def update_own_profile(payload: UserUpdate, current=Depends(get_current_user), db: Session = Depends(get_db)):
    email = current.get("email") if isinstance(current, dict) else getattr(current, "email", None)
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    user = get_by_email(db, email=email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Non-admin owner update rules: reuse same allowed fields as user update route
    incoming = payload.dict(exclude_unset=True)
    allowed = {"first_name", "last_name", "phone_number", "password"}
    if "email" in incoming:
        raise HTTPException(status_code=403, detail="Cannot change email")
    filtered = {k: v for k, v in incoming.items() if k in allowed}
    if not filtered:
        raise HTTPException(status_code=400, detail="No updatable fields provided")

    updated = update_user(db, user, **filtered)
    return updated
