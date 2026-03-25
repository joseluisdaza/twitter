"""Database models for the user service using SQLite."""

import sqlite3
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Optional

DB_PATH = "user_service.db"


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
                email TEXT NOT NULL,
                bio TEXT DEFAULT '',
                profile_picture TEXT DEFAULT '',
                role TEXT DEFAULT 'USER',
                created_at TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS follows (
                follower_id TEXT NOT NULL,
                followee_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                PRIMARY KEY (follower_id, followee_id)
            )
        """)


def create_user(user_id: str, username: str, email: str, role: str = "USER", db_path: str = DB_PATH) -> dict:
    created_at = datetime.now(timezone.utc).isoformat()
    with db_context(db_path) as conn:
        conn.execute(
            "INSERT OR IGNORE INTO users (user_id, username, email, role, created_at) VALUES (?, ?, ?, ?, ?)",
            (user_id, username, email, role, created_at),
        )
    return get_user_by_id(user_id, db_path)


def get_user_by_id(user_id: str, db_path: str = DB_PATH) -> Optional[dict]:
    with db_context(db_path) as conn:
        row = conn.execute("SELECT * FROM users WHERE user_id = ?", (user_id,)).fetchone()
        if not row:
            return None
        user = dict(row)
        user["followers_count"] = conn.execute(
            "SELECT COUNT(*) FROM follows WHERE followee_id = ?", (user_id,)
        ).fetchone()[0]
        user["following_count"] = conn.execute(
            "SELECT COUNT(*) FROM follows WHERE follower_id = ?", (user_id,)
        ).fetchone()[0]
    return user


def update_user(user_id: str, bio: str = None, profile_picture: str = None, db_path: str = DB_PATH) -> Optional[dict]:
    with db_context(db_path) as conn:
        if bio is not None:
            conn.execute("UPDATE users SET bio = ? WHERE user_id = ?", (bio, user_id))
        if profile_picture is not None:
            conn.execute("UPDATE users SET profile_picture = ? WHERE user_id = ?", (profile_picture, user_id))
    return get_user_by_id(user_id, db_path)


def delete_user(user_id: str, db_path: str = DB_PATH) -> bool:
    with db_context(db_path) as conn:
        cursor = conn.execute("DELETE FROM users WHERE user_id = ?", (user_id,))
    return cursor.rowcount > 0


def list_users(page: int = 1, page_size: int = 20, db_path: str = DB_PATH) -> tuple:
    offset = (page - 1) * page_size
    with db_context(db_path) as conn:
        total = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        rows = conn.execute("SELECT * FROM users LIMIT ? OFFSET ?", (page_size, offset)).fetchall()
    users = []
    for row in rows:
        user = dict(row)
        users.append(get_user_by_id(user["user_id"], db_path))
    return users, total


def follow_user(follower_id: str, followee_id: str, db_path: str = DB_PATH) -> bool:
    if follower_id == followee_id:
        return False
    created_at = datetime.now(timezone.utc).isoformat()
    try:
        with db_context(db_path) as conn:
            conn.execute(
                "INSERT INTO follows (follower_id, followee_id, created_at) VALUES (?, ?, ?)",
                (follower_id, followee_id, created_at),
            )
        return True
    except sqlite3.IntegrityError:
        return False


def unfollow_user(follower_id: str, followee_id: str, db_path: str = DB_PATH) -> bool:
    with db_context(db_path) as conn:
        cursor = conn.execute(
            "DELETE FROM follows WHERE follower_id = ? AND followee_id = ?", (follower_id, followee_id)
        )
    return cursor.rowcount > 0


def get_followers(user_id: str, db_path: str = DB_PATH) -> list:
    with db_context(db_path) as conn:
        rows = conn.execute(
            "SELECT u.* FROM users u JOIN follows f ON u.user_id = f.follower_id WHERE f.followee_id = ?",
            (user_id,),
        ).fetchall()
    return [get_user_by_id(dict(r)["user_id"], db_path) for r in rows]


def get_following(user_id: str, db_path: str = DB_PATH) -> list:
    with db_context(db_path) as conn:
        rows = conn.execute(
            "SELECT u.* FROM users u JOIN follows f ON u.user_id = f.followee_id WHERE f.follower_id = ?",
            (user_id,),
        ).fetchall()
    return [get_user_by_id(dict(r)["user_id"], db_path) for r in rows]
