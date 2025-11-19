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
    create_and_store_session,
    generate_otp, 
    verify_otp,
    log_user_in, 
    store_otp,
    store_user_details,
    get_user_details,
    invalidate_session_by_access_token,
    revoke_session_by_jti,
    get_active_sessions_for_user,
    get_current_user
)

from app.core.redis_config import redis_client

from app.utils import send_email_otp

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/password")


@router.get("/google")
async def login_google(request: Request):
    redirect_uri = request.url_for('auth_google_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get('/google/callback')
async def auth_google_callback(request: Request, db: Session = Depends(get_db), force: bool = False):
    try:
        token = await oauth.google.authorize_access_token(request)
    except OAuthError as e:
        # include error info in logs to help debug redirect/config issues
        try:
            import traceback, sys
            logger = None
            try:
                from app.utils import logger as _logger
                logger = _logger
            except Exception:
                logger = None
            if logger:
                logger.error(f"Google authorize_access_token failed: {e}")
                logger.error(traceback.format_exc())
        except Exception:
            pass
        # return a small HTML page to surface the error to the browser
        return Response(content=f"<html><body><h3>Google Auth failed</h3><pre>{str(e)}</pre></body></html>", media_type="text/html", status_code=400)

    user = token.get('userinfo') or {}
    first_name = user.get('given_name')
    last_name = user.get('family_name')
    email = user.get('email')
    picture = user.get('picture')

    if not email:
        raise HTTPException(status_code=400, detail="Google did not return email")

    # create a user in the database if they don't exist
    user = get_by_email(db, email=email)
 
    if not user:
        user = create_user(db, first_name=first_name, last_name=last_name, email=email)
        profile = create_profile(db, photo=picture, user_id=user.id)
    
    # If an existing session exists, and the client didn't pass force, inform the client
    existing = await get_active_sessions_for_user(user.email)
    if existing and not force:
        raise HTTPException(status_code=409, detail={"message": "Active session exists", "sessions": existing})

        # create a session (stores tokens in redis) and return tokens
    tokens = await create_and_store_session(user_id=user.email, role=user.role)

    # For browser-based flows (popup), return a small HTML page that posts tokens to window.opener
    # The frontend popup should listen for a postMessage to receive tokens.
    # Embed tokens inside a <script type="application/json"> block to avoid
    # creating syntax errors when token strings contain characters that would
    # break inline JS. The popup script will read and parse the JSON safely.
    tokens_json = json.dumps({"access_token": tokens["access_token"], "refresh_token": tokens["refresh_token"], "email": email, "token_type": "bearer"})
    html = f"""<!doctype html>
            <html>
            <body>
                <script id="oauth_tokens" type="application/json">{tokens_json}</script>
                <script>
                    try {{
                        var tokens = JSON.parse(document.getElementById('oauth_tokens').textContent);
                        // postMessage to opener (frontend) and then close popup
                        if (window.opener) {{
                            window.opener.postMessage({{type: 'oauth_tokens', tokens: tokens}}, window.opener.location.origin);
                            setTimeout(function(){{ window.close(); }}, 500);
                        }} else {{
                            // fallback: print tokens
                            document.body.innerText = 'Login successful. You can close this window.' + JSON.stringify(tokens);
                        }}
                    }} catch (err) {{
                        document.body.innerText = 'Login successful, but failed to send tokens to opener: ' + err;
                    }}
                </script>
            </body>
            </html>"""

    return Response(content=html, media_type="text/html")


@router.post("/password", response_model=UserTokenData)
async def authenticate_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db), force: bool = False):
    user = get_by_email(db, email=form_data.username)
    if not user or not check_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # check existing sessions (single-session policy). If exists and not forced, return 409.
    # existing = await get_active_sessions_for_user(user.email)
    # if existing and not force:
    #     raise HTTPException(status_code=409, detail={"message": "Active session exists", "sessions": existing})

    # create session and store in redis (this will revoke old sessions)
    tokens = await create_and_store_session(user_id=user.email, role=user.role)
    return {"message": "Password login successful", "access_token": tokens["access_token"], "refresh_token": tokens["refresh_token"], "email": user.email, "token_type": "bearer"}


@router.post("/register")
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = get_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="User already exists, Please log in")
    
    otp = generate_otp()
    await store_otp(user.email, otp)

    await send_email_otp(user.email, otp)
    
    # Store user details in Redis (async)
    await store_user_details(user.email, user.dict())
    
    return {"message": "OTP sent to email"}


@router.post("/login")
async def send_otp_route(user_email: EmailSchema, db: Session = Depends(get_db)):
    db_user = get_by_email(db, email=user_email.email)
    if db_user:
        otp = generate_otp()
        await store_otp(user_email.email, otp)

        await send_email_otp(user_email.email, otp)
        return {"message": "OTP sent to email"}
    else:
        raise HTTPException(status_code=400, detail="User not found, please register first")



@router.post("/verify_otp", response_model=UserTokenData)
async def verify_otp_route(data: OTPVerificationSchema, request: Request, response: Response, db: Session = Depends(get_db), force: bool = False):
    # verify_otp is async
    if not await verify_otp(data.email, data.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    db_user = get_by_email(db, email=data.email)
    if db_user:
        # Check existing sessions
        # existing = await get_active_sessions_for_user(db_user.email)
        # if existing and not force:
        #     raise HTTPException(status_code=409, detail={"message": "Active session exists", "sessions": existing})

        # Log the user in (creates session in redis)
        tokens = await log_user_in(db_user.email, db_user.role)
        # response.set_cookie(key="access_token", value=tokens["access_token"], httponly=True, secure=True, samesite='Strict')
        # response.set_cookie(key="refresh_token", value=tokens["refresh_token"], httponly=True, secure=True, samesite='Strict')
        return tokens
    else:
        # Retrieve user details from Redis (async)
        user_details = await get_user_details(data.email)
        if not user_details:
            raise HTTPException(status_code=400, detail="User details not found in session, try registering again")

        # Create a new user after OTP verification
        new_user = UserCreate(**user_details)
        created_user = create_user(db, **new_user.dict())
        tokens = await log_user_in(created_user.email, created_user.role)
        # response.set_cookie(key="access_token", value=tokens["access_token"], httponly=True, secure=True, samesite='Strict')
        # response.set_cookie(key="refresh_token", value=tokens["refresh_token"], httponly=True, secure=True, samesite='Strict')
        return tokens

    
@router.post("/refresh_token", response_model=UserTokenData)
async def refresh_token_route(request: Request, response: Response, db: Session = Depends(get_db)):

    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Missing refresh token")

    # Look up refresh mapping in redis
    raw = await redis_client.get(f"refresh:{refresh_token}")
    if not raw:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    try:
        refresh_obj = json.loads(raw)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = refresh_obj.get("user_id")
    access_jti = refresh_obj.get("access_jti")

    # optional: invalidate old access token mapping
    if access_jti:
        await redis_client.delete(f"access:{access_jti}")
    # delete old refresh token (rotation)
    await redis_client.delete(f"refresh:{refresh_token}")

    db_user = get_by_email(db, email=user_id)
    if db_user is None:
        raise HTTPException(status_code=401, detail="User not found")

    # create new session and return tokens
    tokens = await log_user_in(db_user.email, db_user.role)
    # response.set_cookie(key="access_token", value=tokens["access_token"], httponly=True, secure=True, samesite='Strict')
    # response.set_cookie(key="refresh_token", value=tokens["refresh_token"], httponly=True, secure=True, samesite='Strict')
    return tokens

  
@router.post("/logout")
async def logout_user(request: Request, response: Response):
    # Try to get tokens from request in this order:
    # 1) Authorization header for access token (Bearer)
    # 2) custom header 'x-refresh-token' for refresh token
    # 3) JSON body fields 'access_token' and/or 'refresh_token'
    # 4) fallback to cookies for backwards-compatibility

    # access token from Authorization header or body or cookie
    access_token = None
    auth_header = request.headers.get("authorization") or request.headers.get("Authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        try:
            access_token = auth_header.split(None, 1)[1].strip()
        except Exception:
            access_token = None

    # refresh token from custom header or request body or cookie
    refresh_token = None
    refresh_token = request.headers.get("x-refresh-token") or request.headers.get("x-refresh")

    # if not found in headers, try JSON body
    if not refresh_token or not access_token:
        try:
            body = await request.json()
        except Exception:
            body = {}

        if not access_token:
            access_token = body.get("access_token") if isinstance(body, dict) else None
        if not refresh_token:
            refresh_token = body.get("refresh_token") if isinstance(body, dict) else None

    # # fallback to cookies (compat)
    # if not refresh_token:
    #     refresh_token = request.cookies.get("refresh_token")
    # if not access_token:
    #     access_token = request.cookies.get("access_token")

    if not refresh_token and not access_token:
        # require at least one token to perform logout (no cookies used)
        raise HTTPException(status_code=400, detail="Missing access_token or refresh_token for logout")

    # invalidate refresh mapping and related access mapping
    if refresh_token:
        raw = await redis_client.get(f"refresh:{refresh_token}")
        if raw:
            try:
                obj = json.loads(raw)
                access_jti = obj.get("access_jti")
                if access_jti:
                    # remove access mapping and associated session meta
                    await revoke_session_by_jti(access_jti)
            except Exception:
                pass
        await redis_client.delete(f"refresh:{refresh_token}")

    # invalidate access token mapping if provided
    if access_token:
        try:
            await invalidate_session_by_access_token(access_token)
        except Exception:
            # best-effort: ignore errors during invalidation
            pass

    return {"message": "User logged out successfully"}
