import sqlite3
from pathlib import Path

from cryptography.fernet import Fernet
from . import config

DB_DIR = Path(__file__).resolve().parent.parent / "data"
DB_PATH = DB_DIR / "deska.db"
KEY_PATH = DB_DIR / ".encryption_key"

_cipher = None


def _ensure_dir():
    DB_DIR.mkdir(parents=True, exist_ok=True)


def _load_or_create_key():
    _ensure_dir()
    if config.ENCRYPTION_KEY:
        return config.ENCRYPTION_KEY.encode()

    if KEY_PATH.exists():
        return KEY_PATH.read_bytes()

    key = Fernet.generate_key()
    KEY_PATH.write_bytes(key)
    return key


def _get_cipher():
    global _cipher
    if _cipher is not None:
        return _cipher

    key = _load_or_create_key()
    try:
        _cipher = Fernet(key)
    except Exception:
        print('DESKA: encryption key invalid, generating new key')
        key = Fernet.generate_key()
        KEY_PATH.write_bytes(key)
        _cipher = Fernet(key)
    return _cipher


def _encrypt(value):
    return _get_cipher().encrypt(str(value).encode()).decode()


def _decrypt(token):
    return _get_cipher().decrypt(token.encode()).decode()


def init_db():
    _ensure_dir()
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("""
        CREATE TABLE IF NOT EXISTS activity_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            application TEXT,
            description TEXT,
            variables TEXT,
            sensitivity TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS learned_actions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            definition TEXT NOT NULL,
            sensitivity TEXT NOT NULL,
            undo_description TEXT,
            auto_confirm INTEGER DEFAULT 0,
            created_at TEXT NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


def get_setting(key):
    _ensure_dir()
    conn = sqlite3.connect(str(DB_PATH))
    row = conn.execute("SELECT value FROM settings WHERE key = ?", (key,)).fetchone()
    conn.close()
    if not row:
        return None
    try:
        return _decrypt(row[0])
    except Exception:
        return None


def set_setting(key, value):
    _ensure_dir()
    encrypted = _encrypt(value)
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (key, encrypted)
    )
    conn.commit()
    conn.close()
