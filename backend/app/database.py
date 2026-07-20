"""SQLite connection handling and schema.

The `items` table is the full schema from SPEC.md §6, created up front with
`CREATE TABLE IF NOT EXISTS`. Phase 2 only populates a subset of its columns
(see SPEC.md §6's note below the schema); the rest stay NULL or use their
declared default until the AI pipeline (Phase 3) fills them in. A single
CREATE-IF-NOT-EXISTS is sufficient here — there's one table, one developer,
and no deployed data to migrate yet, so a migration framework would add
ceremony without solving a problem this project actually has.
"""

import sqlite3

from app.config import settings

SCHEMA = """
CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    source_hash_front TEXT UNIQUE,
    source_hash_back TEXT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    subtype TEXT,
    colors TEXT NOT NULL,
    style_tags TEXT,
    brand TEXT,
    size TEXT,
    purchase_source TEXT,
    purchase_date TEXT,
    condition TEXT DEFAULT 'good',
    special_notes TEXT,
    user_notes TEXT,
    original_front_path TEXT,
    original_back_path TEXT,
    catalog_front_path TEXT,
    catalog_back_path TEXT,
    status_catalog TEXT DEFAULT 'pending',
    error_msg TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
"""


def get_connection() -> sqlite3.Connection:
    settings.database_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(settings.database_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = get_connection()
    try:
        conn.execute(SCHEMA)
        conn.commit()
    finally:
        conn.close()


def check_connection() -> bool:
    """Open a connection, run a trivial query, close it. Returns success."""
    conn = get_connection()
    try:
        conn.execute("SELECT 1")
        return True
    finally:
        conn.close()
