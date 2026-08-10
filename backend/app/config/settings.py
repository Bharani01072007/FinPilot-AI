"""Global Application Settings Module.

Uses Pydantic v2 BaseSettings to load and validate environment variables.
"""

from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Global configuration settings for FinPilot AI Backend."""

    # Application Information
    APP_NAME: str = "FinPilot AI Backend"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Security & Auth JWT Configuration
    SECRET_KEY: str = "change_this_to_a_secure_random_secret_key_in_production"
    JWT_SECRET: str = "change_this_to_a_secure_random_jwt_secret_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    JWT_ISSUER: str = "FinPilot-AI"
    JWT_AUDIENCE: str = "FinPilot-Client"

    # Account Lockout Policy
    MAX_FAILED_LOGIN_ATTEMPTS: int = 5
    ACCOUNT_LOCKOUT_MINUTES: int = 15

    # Database Settings
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres_password"
    POSTGRES_DB: str = "finpilot_db"
    DATABASE_URL: Union[str, None] = None
    DIRECT_URL: Union[str, None] = None

    # SMTP Email Settings for 2FA Dispatch
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM_NAME: str = "FinPilot Security"
    EMAILS_FROM_EMAIL: str = "noreply@finpilot.ai"

    # AI Gateway API Keys & Multi-Key Load Balancing (Groq, Gemini, OpenAI, API4AI)
    GROQ_API_KEY: str = ""
    GROQ_API_KEY_1: str = ""
    GROQ_API_KEY_2: str = ""
    GROQ_API_KEY_3: str = ""
    GROQ_API_KEY_4: str = ""
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    API4AI_OCR_API_KEY: str = "a4a-r2iro0hNRIUTaYEyZd13zRsiYJvwojul"
    OCR_WEBHOOK_URL: str = "https://api.agents.snsihub.ai/webhook/1ebf3266-d339-4133-946d-5c80698b7095"

    # CORS Settings
    CORS_ORIGINS: List[str] = [
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Union[str, None], info) -> str:
        """Construct PostgreSQL connection string if not explicitly provided."""
        if isinstance(v, str) and v.strip():
            return v
        
        values = info.data
        user = values.get("POSTGRES_USER")
        password = values.get("POSTGRES_PASSWORD")
        host = values.get("POSTGRES_SERVER")
        port = values.get("POSTGRES_PORT")
        db = values.get("POSTGRES_DB")
        return f"postgresql://{user}:{password}@{host}:{port}/{db}"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
