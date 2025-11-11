from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import httpx

from app.db.database import get_db
from app.schemas import UserCreate, Token, RefreshRequest
from app.models.user import RefreshToken
from app.core.security import create_access_token, create_refresh_token
from app.core.config import settings

import json

router = APIRouter()

# Host for user service (adjust in production via service discovery)
USER_SERVICE_BASE = settings.USER_SERVICE_BASE


@router.post("/signup", response_model=Token, status_code=201)
def signup(payload: UserCreate, db: Session = Depends(get_db)):
    """Create user in User Service, then issue tokens tied to returned user id."""
    # Call user-service to create the user
    url = f"{USER_SERVICE_BASE}/users/"
    try:
        resp = httpx.post(url, json=payload.model_dump())
    except Exception as e:
        raise HTTPException(status_code=503, detail="User service unavailable")
    if resp.status_code != 201:
        # bubble up error
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    user = resp.json()

    # issue tokens
    access = create_access_token({"sub": str(user["id"])})
    refresh = create_refresh_token()
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    rt = RefreshToken(token=refresh, user_id=str(user["id"]), expires_at=expires_at)
    db.add(rt)
    db.commit()

    return {"access_token": access, "refresh_token": refresh, "token_type": "bearer"}


@router.post("/login", response_model=Token)
def login(payload: UserCreate, db: Session = Depends(get_db)):
    """Authenticate via user-service verify endpoint, then issue tokens."""
    url = f"{USER_SERVICE_BASE}/users/verify"
    try:
        resp = httpx.post(url, json={"email": payload.email, "password": payload.password})
    except Exception:
        raise HTTPException(status_code=503, detail="User service unavailable")
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user = resp.json()
    access = create_access_token({"sub": str(user["id"])})
    refresh = create_refresh_token()
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    rt = RefreshToken(token=refresh, user_id=str(user["id"]), expires_at=expires_at)
    db.add(rt)
    db.commit()
    return {"access_token": access, "refresh_token": refresh, "token_type": "bearer"}


@router.post("/refresh", response_model=Token)
def refresh_token(req: RefreshRequest, db: Session = Depends(get_db)):
    rt = db.query(RefreshToken).filter(RefreshToken.token == req.refresh_token).first()
    if not rt:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    if rt.expires_at < datetime.utcnow():
        db.delete(rt)
        db.commit()
        raise HTTPException(status_code=401, detail="Refresh token expired")

    # rotate refresh token
    new_refresh = create_refresh_token()
    rt.token = new_refresh
    db.add(rt)
    db.commit()

    access = create_access_token({"sub": rt.user_id})
    return {"access_token": access, "refresh_token": new_refresh, "token_type": "bearer"}


@router.post("/introspect")
def introspect(token: str):
    try:
        # TODO: use jose.jwt.decode to verify token and return claims
        payload = json.loads('{}')
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/logout")
def logout(req: RefreshRequest, db: Session = Depends(get_db)):
    rt = db.query(RefreshToken).filter(RefreshToken.token == req.refresh_token).first()
    if rt:
        db.delete(rt)
        db.commit()
    return {"message": "logged out"}
