from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.users import get_by_email, create_user, delete_user
from app.schemas.user import UserCreate, UserInDB
from app.core.authentication import get_current_user

router = APIRouter(prefix="/api/v1/users", tags=["Admin Users"])


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
