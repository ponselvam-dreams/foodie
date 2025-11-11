from pydantic import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg2://user:user@localhost:5433/userdb"

    class Config:
        env_file = ".env"


settings = Settings()
