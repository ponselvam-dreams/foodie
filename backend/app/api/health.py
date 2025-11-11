from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter(prefix="", tags=["Health"])

@router.get("/health")
async def health_check():
    return JSONResponse(content={"status": "ok"})