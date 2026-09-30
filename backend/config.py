"""Central configuration. Values can be overridden with environment variables,
which is how the same code would be configured on a cloud host."""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

SECRET_KEY = os.getenv("CLOUDVAULT_SECRET_KEY", "dev-secret-change-me-in-production-please")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("CLOUDVAULT_TOKEN_MINUTES", "1440"))  # 24 hours

DATABASE_URL = os.getenv("CLOUDVAULT_DATABASE_URL", f"sqlite:///{BASE_DIR / 'cloudvault.db'}")
UPLOAD_DIR = Path(os.getenv("CLOUDVAULT_UPLOAD_DIR", BASE_DIR / "uploads"))

MAX_FILE_SIZE_MB = int(os.getenv("CLOUDVAULT_MAX_FILE_MB", "10"))
MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024

# Only these extensions are accepted. Executables and scripts are rejected.
ALLOWED_EXTENSIONS = {
    ".pdf", ".txt", ".md", ".csv", ".json",
    ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg",
    ".mp3", ".wav", ".mp4", ".mov",
    ".zip", ".rar", ".7z",
    ".py", ".js", ".html", ".css", ".ipynb",
}

FRONTEND_ORIGINS = os.getenv(
    "CLOUDVAULT_FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
).split(",")
