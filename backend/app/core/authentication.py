
import bcrypt
import jwt
import random
import time
import json
from datetime import datetime, timedelta
from pydantic import ValidationError

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


def store_otp(email: str, otp: str, ttl: int = settings.OTP_TTL):
    redis_client.setex(f"otp:{email}",ttl, otp)


def verify_otp(email: str, otp: str) -> bool:
    stored_otp = redis_client.get(f"otp:{email}")
    if stored_otp is None:
        return False
    return stored_otp == otp

#
# Manage session
#
def store_session(user_id: str, access_token: str, refresh_token: str, ttl: int = 2592000):  # 30 days
    session_data = {
        "access_token": access_token,
        "refresh_token": refresh_token
    }
    redis_client.setex(f"session:{user_id}", ttl, json.dumps(session_data))

def get_session(token: str) -> dict:
    user = get_current_user(token)
    session_data = redis_client.get(f"session:{user['email']}")
    if session_data is None:
        return None
    return json.loads(session_data)

def invalidate_session(token: str):
    user = get_current_user(token)
    redis_client.delete(f"session:{user['email']}")

#
# Store/Retrieve user details in redis
#
def store_user_details(email: str, user_details: dict, ttl: int = 300):
    if 'role' in user_details:
        user_details['role'] = user_details['role'].value
    redis_client.setex(f"user_details:{email}", ttl, json.dumps(user_details))


def get_user_details(email: str) -> dict:
    user_details = redis_client.get(f"user_details:{email}")
    if user_details is None:
        return None
    user_details = json.loads(user_details)
    # Convert string back to UserRole
    if 'role' in user_details:
        user_details['role'] = UserRole(user_details['role'])
    return user_details


def log_user_in(email: str, role: UserRole):
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    access_token = create_access_token(
        data={"sub": email, "role": role.value},  # Convert UserRole to string
        expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(
        data={"sub": email, "role": role.value},  # Convert UserRole to string
        expires_delta=refresh_token_expires
    )
    store_session(email, access_token, refresh_token, ttl=2592000)  # 30 days
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "email": email,
        "message": "Login successful"
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
# JWT token creation
#
def create_access_token(*, data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(*, data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

#
# Get current user from token
#
def get_current_user(token: str = Depends(oauth2_scheme)):

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email = payload.get("sub")
        role = payload.get("role")
        if email is None or role is None:
            raise credentials_exception
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.PyJWTError as e:
        print(f"JWTError: {e}")
        raise credentials_exception
    except ValidationError as e:
        print(f"ValidationError: {e}")
        raise credentials_exception

    return {"email": email, "role": role}

