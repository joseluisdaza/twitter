"""Database models for the auth service using SQLite."""

import sqlite3
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Optional

DB_PATH = "auth_service.db"


def get_connection(db_path: str = DB_PATH):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def db_context(db_path: str = DB_PATH):
    conn = get_connection(db_path)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db(db_path: str = DB_PATH):
    with db_context(db_path) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                hashed_password TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'USER',
                created_at TEXT NOT NULL
            )
        """)


def create_user(username: str, email: str, hashed_password: str, role: str = "USER", db_path: str = DB_PATH) -> dict:
    user_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    with db_context(db_path) as conn:
        conn.execute(
            "INSERT INTO users (user_id, username, email, hashed_password, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (user_id, username, email, hashed_password, role, created_at),
        )
    return {"user_id": user_id, "username": username, "email": email, "role": role, "created_at": created_at}


def get_user_by_username(username: str, db_path: str = DB_PATH) -> Optional[dict]:
    with db_context(db_path) as conn:
        row = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    return dict(row) if row else None


def get_user_by_id(user_id: str, db_path: str = DB_PATH) -> Optional[dict]:
    with db_context(db_path) as conn:
        row = conn.execute("SELECT * FROM users WHERE user_id = ?", (user_id,)).fetchone()
    return dict(row) if row else None
