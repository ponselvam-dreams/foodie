
import bcrypt
import jwt
import random
import time
import json
import uuid
import secrets
from datetime import datetime, timedelta, timezone
from pydantic import ValidationError
from typing import Optional

from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer

from app.core.config import settings
from app.schemas.user import UserRole
from app.core.redis_config import redis_client
from app.utils import send_email_otp

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/users/auth")

credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)

#
# Generate OTP and store it in redis
#
def generate_otp():
    return random.randint(1000, 9999)


# --- Async OTP helpers ---
async def store_otp(email: str, otp: str, ttl: int = settings.OTP_TTL):
    await redis_client.setex(f"otp:{email}", ttl, str(otp))


async def verify_otp(email: str, otp: str) -> bool:
    stored_otp = await redis_client.get(f"otp:{email}")
    if stored_otp is None:
        return False
    return str(stored_otp) == str(otp)


#
# Manage session and tokens in Redis (token-keyed) - async
#
def _seconds_from_delta(expires_delta: timedelta) -> int:
    return int(expires_delta.total_seconds())


async def store_tokens_in_redis(user_id: str, access_jti: str, access_payload: dict, access_ttl_seconds: int,
                                refresh_token: str, refresh_payload: dict, refresh_ttl_seconds: int):
    """
    Async: Store token state under token-keyed entries so tokens can be revoked individually.
    Store the refresh token inside the access entry so invalidation can remove it.
    """
    # include refresh token reference in the access payload
    access_payload_with_refresh = dict(access_payload)
    access_payload_with_refresh["refresh_token"] = refresh_token

    # store access and refresh token entries
    await redis_client.setex(f"access:{access_jti}", access_ttl_seconds, json.dumps(access_payload_with_refresh))
    refresh_obj = {"user_id": user_id, "access_jti": access_jti, **refresh_payload}
    await redis_client.setex(f"refresh:{refresh_token}", refresh_ttl_seconds, json.dumps(refresh_obj))

    # track session metadata and associate with user for single-session management
    session_meta = {"access_jti": access_jti, "refresh_token": refresh_token, "created_at": int(time.time())}
    # store session metadata and add to user's session set
    await redis_client.setex(f"sessionmeta:{access_jti}", refresh_ttl_seconds, json.dumps(session_meta))
    # use a set to track active sessions per user
    await redis_client.sadd(f"user_sessions:{user_id}", access_jti)


async def create_and_store_session(user_id: str, role: UserRole,
                                   access_expires: timedelta = None, refresh_expires: timedelta = None):
    """Async: Create JWTs (with jti) and store their state in redis"""
    if access_expires is None:
        access_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    if refresh_expires is None:
        refresh_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    access_jti = uuid.uuid4().hex
    refresh_token = secrets.token_urlsafe(48)

    # use timezone-aware UTC timestamps everywhere to avoid local-tz related issues
    now = datetime.now(timezone.utc)
    access_payload = {"sub": user_id, "role": role.value, "jti": access_jti, "iat": now.timestamp()}
    access_exp = now + access_expires
    access_payload["exp"] = int(access_exp.timestamp())
    access_token = jwt.encode(access_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    refresh_payload = {"sub": user_id, "role": role.value, "iat": int(now.timestamp())}
    refresh_exp = now + refresh_expires
    refresh_payload["exp"] = int(refresh_exp.timestamp())

    # Enforce single-session: revoke any existing sessions for this user before creating a new one
    try:
        await revoke_all_sessions_for_user(user_id)
    except Exception:
        # best-effort: continue even if cleanup fails
        pass

    # store in redis (async)
    await store_tokens_in_redis(
        user_id=user_id,
        access_jti=access_jti,
        access_payload=access_payload,
        access_ttl_seconds=_seconds_from_delta(access_expires),
        refresh_token=refresh_token,
        refresh_payload=refresh_payload,
        refresh_ttl_seconds=_seconds_from_delta(refresh_expires),
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": _seconds_from_delta(access_expires),
        "jti": access_jti,
    }

async def get_session_by_access_token(token: str) -> Optional[dict]:
    """
    Async: verify token by decoding to get jti and then consult Redis.
    Returns payload dict or None.
    """
    try:
        # allow a small leeway to account for tiny clock skew between systems
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM], leeway=10)
    except jwt.ExpiredSignatureError:
        return None
    except jwt.PyJWTError:
        return None

    jti = payload.get("jti")
    if not jti:
        return None
    stored = await redis_client.get(f"access:{jti}")
    if not stored:
        return None
    try:
        return json.loads(stored)
    except Exception:
        return None

async def invalidate_session_by_access_token(token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM], options={"verify_exp": False})
    except jwt.PyJWTError:
        return
    jti = payload.get("jti")
    if jti:
        # try to remove linked refresh token if present in stored access payload
        raw = await redis_client.get(f"access:{jti}")
        if raw:
            try:
                obj = json.loads(raw)
                refresh = obj.get("refresh_token")
                if refresh:
                    await redis_client.delete(f"refresh:{refresh}")
            except Exception:
                pass
        await redis_client.delete(f"access:{jti}")


async def revoke_all_sessions_for_user(user_id: str):
    """Remove all sessions associated with a user (access, refresh, sessionmeta, and user_sessions set).
    This is used to enforce a single active session per user.
    """
    key = f"user_sessions:{user_id}"
    members = await redis_client.smembers(key)
    if not members:
        return

    # members may be bytes depending on client; normalize to strings
    members = [m.decode() if isinstance(m, (bytes, bytearray)) else m for m in members]

    # pipeline delete for efficiency
    pipe = redis_client.pipeline()
    for access_jti in members:
        # get sessionmeta to find refresh token
        meta_raw = await redis_client.get(f"sessionmeta:{access_jti}")
        if meta_raw:
            try:
                meta = json.loads(meta_raw)
                refresh = meta.get("refresh_token")
                if refresh:
                    pipe.delete(f"refresh:{refresh}")
            except Exception:
                pass
        pipe.delete(f"access:{access_jti}")
        pipe.delete(f"sessionmeta:{access_jti}")

    pipe.delete(key)
    await pipe.execute()


async def revoke_session_by_jti(access_jti: str):
    """Remove a single session identified by access_jti: delete access, refresh, sessionmeta and remove from user's session set."""
    if not access_jti:
        return

    raw = await redis_client.get(f"access:{access_jti}")
    user_id = None
    refresh = None
    if raw:
        try:
            obj = json.loads(raw)
            refresh = obj.get("refresh_token")
            user_id = obj.get("sub")
        except Exception:
            pass

    # pipeline deletion
    pipe = redis_client.pipeline()
    if refresh:
        pipe.delete(f"refresh:{refresh}")
    pipe.delete(f"access:{access_jti}")
    pipe.delete(f"sessionmeta:{access_jti}")
    if user_id:
        pipe.srem(f"user_sessions:{user_id}", access_jti)
    await pipe.execute()


async def get_active_sessions_for_user(user_id: str):
    """Return list of session metadata dicts for a given user_id (may be empty)."""
    key = f"user_sessions:{user_id}"
    members = await redis_client.smembers(key)
    if not members:
        return []
    members = [m.decode() if isinstance(m, (bytes, bytearray)) else m for m in members]
    sessions = []
    for access_jti in members:
        meta_raw = await redis_client.get(f"sessionmeta:{access_jti}")
        if not meta_raw:
            continue
        try:
            meta = json.loads(meta_raw)
            # include jti for reference but redact sensitive fields
            meta["jti"] = access_jti
            if "refresh_token" in meta:
                meta.pop("refresh_token", None)
            sessions.append(meta)
        except Exception:
            continue
    return sessions


#
# Store/Retrieve user details in redis (async)
#
async def store_user_details(email: str, user_details: dict, ttl: int = 300):
    if "role" in user_details and isinstance(user_details["role"], UserRole):
        user_details["role"] = user_details["role"].value
    await redis_client.setex(f"user_details:{email}", ttl, json.dumps(user_details))


async def get_user_details(email: str) -> Optional[dict]:
    user_details_raw = await redis_client.get(f"user_details:{email}")
    if user_details_raw is None:
        return None
    user_details = json.loads(user_details_raw)
    if "role" in user_details:
        try:
            user_details["role"] = UserRole(user_details["role"])
        except Exception:
            pass
    return user_details


async def log_user_in(email: str, role: UserRole):
    # call async create_and_store_session using canonical user id (email or uuid)
    session = await create_and_store_session(user_id=email, role=role)
    return {
        "access_token": session["access_token"],
        "refresh_token": session["refresh_token"],
        "token_type": "bearer",
        "email": email,
        "message": "Login successful",
        "expires_in": session["expires_in"],
    }

#
# Password hashing and verification
#
def hash_password(password: str) -> str:
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password_bytes, salt)
    return hashed_password.decode('utf-8')


def check_password(password: str, hashed_password: str) -> bool:
    password_bytes = password.encode('utf-8')
    hashed_password_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_password_bytes)


#
# Get current user dependency (FastAPI) - async
#
async def _verify_token_and_get_payload(token: str):
    """
    Pure helper: decode token, check redis (async), return payload dict or raise credentials_exception.
    """
    try:
        # verify token expiry using UTC-aware timestamps; allow small leeway
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM], leeway=10)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.PyJWTError:
        raise credentials_exception

    jti = payload.get("jti")
    if not jti:
        raise credentials_exception

    stored = await redis_client.get(f"access:{jti}")
    if not stored:
        raise credentials_exception
    try:
        return json.loads(stored)
    except Exception:
        raise credentials_exception



async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    FastAPI dependency: returns payload available in redis for the access token
    """
    payload = await _verify_token_and_get_payload(token)
    # normalize payload for downstream handlers: include an `email` key
    # mapped from the JWT `sub` claim (common expectation across handlers)
    try:
        if isinstance(payload, dict):
            if "email" not in payload and "sub" in payload:
                payload["email"] = payload.get("sub")
    except Exception:
        # best-effort normalization; do not fail auth if mapping cannot be applied
        pass
    return payload


