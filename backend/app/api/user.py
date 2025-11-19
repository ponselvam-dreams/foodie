from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.users import get_by_email, update_user
from app.schemas.user import UserUpdate, UserInDB
from app.core.authentication import get_current_user

router = APIRouter(prefix="/api/v1/users", tags=["Users"])


@router.get("/{user_id}", response_model=UserInDB)
def read_user(user_id: int, db: Session = Depends(get_db)):
    # simple query using model helper
    from app.models.users import User
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return u


@router.patch("/{user_id}", response_model=UserInDB)
def update_user_endpoint(user_id: int, payload: UserUpdate, db: Session = Depends(get_db), current=Depends(get_current_user)):
    from app.models.users import User
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    # permission checks
    cur_email = None
    cur_role = None
    if isinstance(current, dict):
        cur_email = current.get("email")
        cur_role = current.get("role")
    else:
        cur_email = getattr(current, "email", None)
        cur_role = getattr(current, "role", None)

    # Admin can update any fields
    if cur_role == "admin":
        updated = update_user(db, u, **payload.dict(exclude_unset=True))
        return updated

    # Non-admin: only owner can update and only limited fields
    if cur_email != u.email:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    allowed = {"first_name", "last_name", "phone_number", "password"}
    incoming = payload.dict(exclude_unset=True)
    # disallow email change by non-admin
    if "email" in incoming:
        raise HTTPException(status_code=403, detail="Cannot change email")

    filtered = {k: v for k, v in incoming.items() if k in allowed}
    if not filtered:
        raise HTTPException(status_code=400, detail="No updatable fields provided")

    updated = update_user(db, u, **filtered)
    return updated



