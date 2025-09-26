import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.db.database import Base, engine
from app.api import core, community, workshops, auth
from app import models

# Load env variables
load_dotenv()


app = FastAPI(title="FoodieAI Backend", version="1.1")


# Enable frontend calls
app.add_middleware(
CORSMiddleware,
allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
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

@app.get("/")
def root():
    return {"message": "Backend is running with AI Chef 🍳"}