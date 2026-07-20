"""Application configuration, loaded from environment variables / .env.

Paths are resolved relative to this file, not the process's current working
directory, so the app behaves the same regardless of where `uvicorn` is
launched from.
"""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BACKEND_DIR.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / ".env",
        extra="ignore",
    )

    gemini_api_key: str = ""
    image_model: str = "gemini-3.1-flash-image"
    text_model: str = "gemini-2.5-flash"
    database_path: Path = PROJECT_ROOT / "data" / "wardrobe.db"
    originals_dir: Path = PROJECT_ROOT / "data" / "originals"
    catalog_dir: Path = PROJECT_ROOT / "data" / "catalog"
    max_upload_bytes: int = 10 * 1024 * 1024


settings = Settings()
