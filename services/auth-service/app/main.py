from fastapi import FastAPI
from app.api import auth as auth_router
from app.db.database import engine

app = FastAPI(title="Auth Service")

app.include_router(auth_router.router, prefix="/api/v1/auth", tags=["auth"])

@app.on_event("startup")
async def startup_event():
    # In dev you can uncomment create_all to ensure tables exist
    from app.db import create_tables
    create_tables.create_all()
