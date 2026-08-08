import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./needhiai.db"
    JWT_SECRET: str = "dev-secret-change-in-production-please-use-long-random-string"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24

    LLM_API_KEY: str = ""
    LLM_MODEL: str = "gpt-4o-mini"
    LLM_BASE_URL: str = "https://api.openai.com/v1"
    LLM_PROVIDER: str = "auto"

    EMBEDDING_PROVIDER: str = "local_tfidf"
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"

    VECTOR_DB_PATH: str = "./chroma_data"
    VECTOR_DB_TYPE: str = "chroma"

    MAX_FILE_SIZE_MB: int = 25
    UPLOAD_DIR: str = "./uploads"
    ALLOWED_EXTENSIONS: str = "pdf,docx,jpg,jpeg,png"

    APP_ENV: str = "development"
    CORS_ORIGINS: str = "*"

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"

    @property
    def allowed_extensions_list(self) -> List[str]:
        return [e.strip().lower() for e in self.ALLOWED_EXTENSIONS.split(",")]

    @property
    def cors_origins_list(self) -> List[str]:
        if self.CORS_ORIGINS == "*":
            return ["*"]
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

settings = Settings()

# Ensure upload dir exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.VECTOR_DB_PATH, exist_ok=True)
