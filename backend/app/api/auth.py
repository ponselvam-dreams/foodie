# app/api/api_v1/endpoints/auth.py
import json

from fastapi import APIRouter, Request, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from authlib.integrations.starlette_client import OAuthError

from app.schemas.auth import EmailSchema, OTPVerificationSchema, UserTokenData, RefreshTokenSchema
from app.schemas.user import UserCreate
from app.models.users import (
    get_by_email,
    create_user
)
from app.models.profile import  create_profile
from app.db.database import get_db
from app.core.oauth_config import oauth
from app.core.authentication import ( 
    check_password, 
    create_access_token,
    create_refresh_token,
    generate_otp, 
    verify_otp,
    log_user_in, 
    store_otp,
    store_user_details,
    get_user_details,
    get_session,
    invalidate_session,
    get_current_user
)

from app.utils import send_email_otp

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/password")


@router.get("/google")
async def login_google(request: Request):
    redirect_uri = request.url_for('auth_google_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get('/google/callback', response_model=UserTokenData)
async def auth_google_callback(request: Request, db: Session = Depends(get_db)):

    try:
        token = await oauth.google.authorize_access_token(request)
    except OAuthError as e:
        raise HTTPException(status_code=400, detail="Google Auth failed")
    
    user = token.get('userinfo')
    first_name = user.get('given_name')
    last_name = user.get('family_name')
    email = user.get('email')
    picture = user.get('picture')

    # Create a user in the database if they don't exist
    user = get_by_email(db, email=email)
 
    if not user:
        user = create_user(db, first_name=first_name, last_name=last_name, email=email)
        profile = create_profile(db, photo=picture, user_id=user.id)
    
    # create a session or token for the user
    token = create_access_token(data={"sub": user.email, "role": user.role})
    refresh_token = create_refresh_token(data={"sub": user.email})
    return {"message": "Google login successful", "email": email, 'access_token': token,"refresh_token":refresh_token, "token_type": "bearer"}


@router.post("/password", response_model=UserTokenData)
async def authenticate_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = get_by_email(db, email=form_data.username)
    print(user)
    if not user or not check_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(data={"sub": user.email})
    return {"message": "Password login successful", "access_token": token,"refresh_token":refresh_token, "email": user.email, "token_type": "bearer"}


@router.post("/register")
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = get_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="User already exists, Please log in")
    
    otp = generate_otp()
    store_otp(user.email, otp)

    await send_email_otp(user.email, otp)
    
    # Store user details in Redis
    store_user_details(user.email, user.dict())
    
    return {"message": "OTP sent to email"}


@router.post("/login")
async def send_otp_route(user_email: EmailSchema):
    
    otp = generate_otp()
    store_otp(user_email.email, otp)

    await send_email_otp(user_email.email, otp)
    return {"message": "OTP sent to email"}


@router.post("/verify_otp", response_model=UserTokenData)
async def verify_otp_route(data: OTPVerificationSchema, request: Request, response: Response, db: Session = Depends(get_db)):
    if not verify_otp(data.email, data.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    db_user = get_by_email(db, email=data.email)
    if db_user:
        # Log the user in
        tokens = log_user_in(db_user.email, db_user.role)
        response.set_cookie(key="access_token", value=tokens["access_token"], httponly=True, secure=True, samesite='Strict')
        response.set_cookie(key="refresh_token", value=tokens["refresh_token"], httponly=True, secure=True, samesite='Strict')
        return tokens
        

    else:
        # Retrieve user details from Redis
        user_details = get_user_details(data.email)
        if not user_details:
            raise HTTPException(status_code=400, detail="User details not found in session, try registering again")
        
        # Create a new user after OTP verification
        new_user = UserCreate(**user_details)
        created_user = create_user(db, **new_user.dict())
        tokens = log_user_in(created_user.email, created_user.role)
        response.set_cookie(key="access_token", value=tokens["access_token"], httponly=True, secure=True, samesite='Strict')
        response.set_cookie(key="refresh_token", value=tokens["refresh_token"], httponly=True, secure=True, samesite='Strict')
        return tokens

    
@router.post("/refresh_token", response_model=UserTokenData)
async def refresh_token_route(request: Request, response: Response, db: Session = Depends(get_db)):

    refresh_token = request.cookies.get("refresh_token")

    user_data = get_current_user(refresh_token)
    email = user_data['email']
    db_user = get_by_email(db, email=email)

    if db_user is None:
        raise HTTPException(status_code=401, detail="User not found")

    session_data = get_session(refresh_token)
    if session_data is None or session_data["refresh_token"] != refresh_token:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    # Generate new access and refresh tokens
    tokens = log_user_in(db_user.email, db_user.role)
    response.set_cookie(key="access_token", value=tokens["access_token"], httponly=True, secure=True, samesite='Strict')
    response.set_cookie(key="refresh_token", value=tokens["refresh_token"], httponly=True, secure=True, samesite='Strict')
    return tokens
    
@router.post("/logout")
async def logout_user(request: Request, response: Response):
    invalidate_session(request.cookies.get("refresh_token"))
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token")
    return {"message": "User logged out successfully"}