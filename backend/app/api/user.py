from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.users import get_by_email, create_user, update_user, delete_user
from app.schemas.user import UserCreate, UserUpdate, UserInDB
from app.core.authentication import get_current_user

router = APIRouter(prefix="/api/v1/users", tags=["Users"])


@router.post("/", response_model=UserInDB, status_code=201)
def create_user_endpoint(user: UserCreate, db: Session = Depends(get_db), current=Depends(get_current_user)):
    # only admin can create users
    role = None
    if isinstance(current, dict):
        role = current.get("role")
    else:
        role = getattr(current, "role", None)
    if role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create users")

    existing = get_by_email(db, email=user.email)
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    created = create_user(db, **user.dict())
    return created


@router.get("/me", response_model=UserInDB)
async def read_own_profile(current=Depends(get_current_user), db: Session = Depends(get_db)):
    # current is expected to include 'email'
    email = current.get("email") if isinstance(current, dict) else None
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    user = get_by_email(db, email=email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


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


@router.delete("/{user_id}")
def delete_user_endpoint(user_id: int, db: Session = Depends(get_db), current=Depends(get_current_user)):
    # only admin can delete users
    cur_role = None
    if isinstance(current, dict):
        cur_role = current.get("role")
    else:
        cur_role = getattr(current, "role", None)
    if cur_role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete users")

    from app.models.users import User
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    delete_user(db, u)
    return {"message": "user deleted"}
