import os
from pydantic_settings import BaseSettings

_BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
_ROOT_DIR = os.path.abspath(os.path.join(_BACKEND_DIR, ".."))
_DEFAULT_DB_PATH = os.path.join(_BACKEND_DIR, "kaarigar.db")
# Fallback to legacy kalahaat.db if kaarigar.db does not exist yet
if not os.path.exists(_DEFAULT_DB_PATH):
    _LEGACY_DB_PATH = os.path.join(_BACKEND_DIR, "kalahaat.db")
    if os.path.exists(_LEGACY_DB_PATH):
        _DEFAULT_DB_PATH = _LEGACY_DB_PATH


class Settings(BaseSettings):
    """Application settings loaded from environment variables / .env file."""

    # Database – defaults to SQLite for instant local demo
    DATABASE_URL: str = f"sqlite:///{_DEFAULT_DB_PATH}"

    # Auth
    SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7  # 1 week

    # Mock OTP – any 6-digit code accepted; this fixed code always works
    MOCK_OTP_CODE: str = "123456"

    # Gemini AI – updated to current Google Gemini 2.0 Flash
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"

    # Cloudinary (optional – falls back to local disk)
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # CORS
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    # Pricing constants
    FAIR_HOURLY_WAGE_INR: float = 150.0  # above local casual labour rates
    PLATFORM_FEE_INR: float = 0.0  # zero for MVP

    # Upload limits
    MAX_IMAGE_SIZE_MB: int = 10
    MAX_IMAGES_PER_LISTING: int = 4

    model_config = {
        "env_file": (
            os.path.join(_BACKEND_DIR, ".env"),
            os.path.join(_ROOT_DIR, ".env"),
            ".env",
        ),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
