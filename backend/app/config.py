import os
from pydantic import BaseModel

class Settings(BaseModel):
    APP_NAME: str = "REPROVIA"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./reprovia.db")
    EXECUTION_MODE: str = os.getenv("EXECUTION_MODE", "mock")  # "mock" or "kubernetes"
    KUBERNETES_NAMESPACE: str = os.getenv("KUBERNETES_NAMESPACE", "reprovia-workloads")
    ARTIFACT_STORAGE_PATH: str = os.getenv("ARTIFACT_STORAGE_PATH", "./artifacts_storage")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "reprovia-scientific-reproducibility-secret-key-2026")
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]

settings = Settings()
