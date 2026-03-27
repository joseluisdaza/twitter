"""Database models for the tweet service using SQLite."""

import sqlite3
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Optional

DB_PATH = "tweet_service.db"


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
            CREATE TABLE IF NOT EXISTS tweets (
                tweet_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                username TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS likes (
                tweet_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                PRIMARY KEY (tweet_id, user_id)
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS follows (
                follower_id TEXT NOT NULL,
                followee_id TEXT NOT NULL,
                PRIMARY KEY (follower_id, followee_id)
            )
        """)


def create_tweet(user_id: str, username: str, content: str, db_path: str = DB_PATH) -> dict:
    tweet_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    with db_context(db_path) as conn:
        conn.execute(
            "INSERT INTO tweets (tweet_id, user_id, username, content, created_at) VALUES (?, ?, ?, ?, ?)",
            (tweet_id, user_id, username, content, created_at),
        )
    return get_tweet_by_id(tweet_id, db_path=db_path)


def get_tweet_by_id(tweet_id: str, viewer_id: str = None, db_path: str = DB_PATH) -> Optional[dict]:
    with db_context(db_path) as conn:
        row = conn.execute("SELECT * FROM tweets WHERE tweet_id = ?", (tweet_id,)).fetchone()
        if not row:
            return None
        tweet = dict(row)
        tweet["likes_count"] = conn.execute(
            "SELECT COUNT(*) FROM likes WHERE tweet_id = ?", (tweet_id,)
        ).fetchone()[0]
        tweet["retweets_count"] = 0
        tweet["is_liked"] = False
        if viewer_id:
            liked = conn.execute(
                "SELECT 1 FROM likes WHERE tweet_id = ? AND user_id = ?", (tweet_id, viewer_id)
            ).fetchone()
            tweet["is_liked"] = liked is not None
    return tweet


def delete_tweet(tweet_id: str, user_id: str, db_path: str = DB_PATH) -> bool:
    with db_context(db_path) as conn:
        cursor = conn.execute(
            "DELETE FROM tweets WHERE tweet_id = ? AND user_id = ?", (tweet_id, user_id)
        )
    return cursor.rowcount > 0


def list_tweets(page: int = 1, page_size: int = 20, viewer_id: str = None, db_path: str = DB_PATH):
    offset = (page - 1) * page_size
    with db_context(db_path) as conn:
        total = conn.execute("SELECT COUNT(*) FROM tweets").fetchone()[0]
        rows = conn.execute(
            "SELECT tweet_id FROM tweets ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (page_size, offset),
        ).fetchall()
    tweets = [get_tweet_by_id(r[0], viewer_id, db_path) for r in rows]
    return [t for t in tweets if t], total


def get_user_tweets(user_id: str, page: int = 1, page_size: int = 20, viewer_id: str = None, db_path: str = DB_PATH):
    offset = (page - 1) * page_size
    with db_context(db_path) as conn:
        total = conn.execute("SELECT COUNT(*) FROM tweets WHERE user_id = ?", (user_id,)).fetchone()[0]
        rows = conn.execute(
            "SELECT tweet_id FROM tweets WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (user_id, page_size, offset),
        ).fetchall()
    tweets = [get_tweet_by_id(r[0], viewer_id, db_path) for r in rows]
    return [t for t in tweets if t], total


def like_tweet(tweet_id: str, user_id: str, db_path: str = DB_PATH) -> bool:
    created_at = datetime.now(timezone.utc).isoformat()
    try:
        with db_context(db_path) as conn:
            conn.execute(
                "INSERT INTO likes (tweet_id, user_id, created_at) VALUES (?, ?, ?)",
                (tweet_id, user_id, created_at),
            )
        return True
    except sqlite3.IntegrityError:
        return False


def unlike_tweet(tweet_id: str, user_id: str, db_path: str = DB_PATH) -> bool:
    with db_context(db_path) as conn:
        cursor = conn.execute(
            "DELETE FROM likes WHERE tweet_id = ? AND user_id = ?", (tweet_id, user_id)
        )
    return cursor.rowcount > 0


def get_timeline(user_id: str, page: int = 1, page_size: int = 20, db_path: str = DB_PATH):
    offset = (page - 1) * page_size
    with db_context(db_path) as conn:
        rows = conn.execute(
            """SELECT t.tweet_id FROM tweets t
               WHERE t.user_id IN (
                   SELECT followee_id FROM follows WHERE follower_id = ?
               ) OR t.user_id = ?
               ORDER BY t.created_at DESC LIMIT ? OFFSET ?""",
            (user_id, user_id, page_size, offset),
        ).fetchall()
    tweets = [get_tweet_by_id(r[0], user_id, db_path) for r in rows]
    return [t for t in tweets if t]
