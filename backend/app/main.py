import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv
# Load env variables
load_dotenv()

from app.db.database import Base, engine
from app.api import core, community, workshops, auth, health, user, profile
from app.api.admin import user as admin_user
from app.core.config import settings
from app.core.middleware import APIKeyMiddleware



app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)


# Enable frontend calls
app.add_middleware(
CORSMiddleware,
allow_origins=settings.CORS_ALLOW_ORIGINS,
allow_credentials=True,
allow_methods=["*"],
allow_headers=["*"],
)

app.add_middleware(APIKeyMiddleware)
# Required for OAuth flows that use server-side session state (authlib/starlette)
# Stores a signed session cookie so `request.session` is available during the OAuth redirect
# In production ensure SECRET_KEY is a strong secret and app is served over HTTPS.
app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

# Create DB tables
Base.metadata.create_all(bind=engine)


# Include routers
app.include_router(core.router)
app.include_router(community.router)
app.include_router(workshops.router)
app.include_router(auth.router)
app.include_router(health.router)
app.include_router(user.router)
app.include_router(profile.router)
app.include_router(admin_user.router)

# @app.get("/")
# def root():
#     return {"message": "Backend is running with AI Chef 🍳"}

# add apikeymiddleware
