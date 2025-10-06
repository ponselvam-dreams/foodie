import os
from ..version import __version__
from enum import Enum

class Config:
    PROJECT_NAME = "FoodieAI Backend"
    VERSION = __version__


class DevelopmentConfig(Config):
    DEBUG = True
    API_KEY = 'test_secret_key'
    API_KEY_VALUE = 'test_api_key_value'
    POSTGRES_DATABASE_URL = "postgresql+psycopg2://foodieai_admin:foodieai2025!@localhost:5432/foodieai"
    CORS_ALLOW_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]

    EXCLUDE_PATHS = ['/health']


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
