from urllib import request
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.core.config import settings
from app.utils import logger
from fastapi import HTTPException
from app.core.authentication import _verify_token_and_get_payload


class APIKeyMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):

        # fast path for preflight
        if request.method == "OPTIONS":
            response = JSONResponse(content={})
            response.headers["Access-Control-Allow-Origin"] = "*"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, x-api-key"
            return response
        
        # Skip auth for configured public paths
        if request.url.path in getattr(settings, "EXCLUDE_PATHS", []):
            logger.debug(f"Skipping auth for {request.url.path}")
            response = await call_next(request)
            return response

        # If a Bearer token is present, validate it and skip API key checks entirely
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split("Bearer ", 1)[1].strip()
            try:
                payload = await _verify_token_and_get_payload(token)
                # attach identity for downstream handlers
                request.state.user = payload
                response = await call_next(request)
                # add CORS headers before returning
                response.headers["Access-Control-Allow-Origin"] = "*"
                response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
                response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, x-api-key"
                return response
            except HTTPException as exc:
                return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


        # No bearer token -> fall back to API key check
        api_key = request.headers.get(settings.API_KEY)
        if api_key != settings.API_KEY_VALUE:
            error_response = JSONResponse(
                status_code=401,
                content={"detail": "Invalid API key"},
            )
            return error_response

        response = await call_next(request)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, x-api-key"
        return response
        
        