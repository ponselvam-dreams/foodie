import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.db.database import Base, engine
from app.api import core, community, workshops, auth, health
from app import models
from app.config import settings

# Load env variables
load_dotenv()


app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)


# Enable frontend calls
app.add_middleware(
CORSMiddleware,
allow_origins=settings.CORS_ALLOW_ORIGINS,
allow_credentials=True,
allow_methods=["*"],
allow_headers=["*"],
)


# Create DB tables
Base.metadata.create_all(bind=engine)


# Include routers
app.include_router(core.router)
app.include_router(community.router)
app.include_router(workshops.router)
app.include_router(auth.router)
app.include_router(health.router)

@app.get("/")
def root():
    return {"message": "Backend is running with AI Chef 🍳"}