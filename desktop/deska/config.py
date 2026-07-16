import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:4000")
AUTH_TOKEN = os.getenv("DESKA_AUTH_TOKEN", "")
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", "")
WAKE_PHRASE = os.getenv("WAKE_PHRASE", "hey deska")
DEFAULT_LANGUAGE = os.getenv("DEFAULT_LANGUAGE", "en")
DEVICE_ID = os.getenv("DESKA_DEVICE_ID", "")

ASSETS_DIR = BASE_DIR / "assets"
ICON_PATH = ASSETS_DIR / "icon.png"
