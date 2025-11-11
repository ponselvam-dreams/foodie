from fastapi import FastAPI
from app.api import users as users_router
from app.api import profiles as profiles_router

app = FastAPI(title="User Service")

app.include_router(users_router.router, prefix="/users", tags=["users"])
app.include_router(profiles_router.router, prefix="/profiles", tags=["profiles"])


@app.on_event("startup")
async def startup_event():
    from app.db import create_tables
    create_tables.create_all()
