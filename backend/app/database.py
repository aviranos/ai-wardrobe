"""SQLite connection handling.

Phase 1 only proves the app can open and close a connection at the
configured path. Schema creation (the `items` table) starts in Phase 2.
"""

import sqlite3

from app.config import settings


def get_connection() -> sqlite3.Connection:
    settings.database_path.parent.mkdir(parents=True, exist_ok=True)
    return sqlite3.connect(settings.database_path)


def check_connection() -> bool:
    """Open a connection, run a trivial query, close it. Returns success."""
    conn = get_connection()
    try:
        conn.execute("SELECT 1")
        return True
    finally:
        conn.close()
