import os
from pydantic import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://familypoints:familypoints@localhost:5432/familypoints_dev")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "devsecret")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60*24*7
    # allow Vite dev server (5173) and older default (3000)
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")

settings = Settings()
