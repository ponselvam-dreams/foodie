import os
from ..version import __version__
from enum import Enum

class Config:
    PROJECT_NAME = "FoodieAI Backend"
    VERSION = __version__

    SECRET_KEY = "your-secret-key"
    ALGORITHM = "HS256"


class DevelopmentConfig(Config):
    DEBUG = True
    API_KEY = 'test_secret_key'
    API_KEY_VALUE = 'test_api_key_value'
    POSTGRES_DATABASE_URL = "postgresql+psycopg2://foodieai_admin:foodieai2025!@localhost:5432/foodieai"
    CORS_ALLOW_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]

    EXCLUDE_PATHS = ['/health','/docs','/openapi.json','/redoc']

    OTP_TTL = 300  # OTP time-to-live in seconds (5 minutes)
    ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 1 hour
    REFRESH_TOKEN_EXPIRE_DAYS = 60 * 24 * 7  # 7 days

    # Redis configuration
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: str = "foodieai@123"

    # Mail configuration
    SMTP_SERVER = os.getenv("SMTP_SERVER")
    SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
    SMTP_USER = os.getenv("SMTP_USER")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
    SMTP_STARTTLS = os.getenv("SMTP_STARTTLS", "True") == "True"
    SMTP_SSL_TLS = os.getenv("SMTP_SSL_TLS", "False") == "True"
    SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL")
    SMTP_VALIDATE_CERTS = os.getenv("SMTP_VALIDATE_CERTS", "True") == "True"

    # OAuth configuration
    OAUTH_NAME = os.getenv("OAUTH_NAME", "google")
    OAUTH_CLIENT_ID = os.getenv("OAUTH_CLIENT_ID")
    OAUTH_CLIENT_SECRET = os.getenv("OAUTH_CLIENT_SECRET")
    OAUTH_AUTH_URL = os.getenv("OAUTH_AUTH_URL", "https://accounts.google.com/o/oauth2/auth")
    OAUTH_AUTHORIZE_PARAMS = os.getenv("OAUTH_AUTHORIZE_PARAMS")
    OAUTH_ACCESS_TOKEN_URL = os.getenv("OAUTH_ACCESS_TOKEN_URL", "https://accounts.google.com/o/oauth2/token")
    OAUTH_ACCESS_TOKEN_PARAMS = os.getenv("OAUTH_ACCESS_TOKEN_PARAMS")
    OAUTH_REFRESH_TOKEN_URL = os.getenv("OAUTH_REFRESH_TOKEN_URL")
    OAUTH_REDIRECT_URI = os.getenv("OAUTH_REDIRECT_URI", "http://localhost:8000/api/v1/auth/google/callback")
    OAUTH_SCOPE = os.getenv("OAUTH_SCOPE", "openid email profile")
    OAUTH_SERVER_METADATA_URL = os.getenv("OAUTH_SERVER_METADATA_URL", "https://accounts.google.com/.well-known/openid-configuration")

class ProductionConfig(Config):
    DEBUG = False
    API_KEY = os.getenv("API_KEY")
    API_KEY_VALUE = os.getenv("API_KEY_VALUE")
    POSTGRES_DATABASE_URL = os.getenv("POSTGRES_DATABASE_URL")
    EXCLUDE_PATHS = ['/health']


config = {
    "development": DevelopmentConfig,
    "production": ProductionConfig
}


settings = config[os.getenv("ENV", "development")]()
