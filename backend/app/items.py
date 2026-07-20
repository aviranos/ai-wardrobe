"""Item routes: create (with dedup + rollback), list, delete.

Phase 2 has no AI pipeline: creating an item writes the uploaded files and a
DB row with name/category/subtype/colors/image paths populated from the
user's own input (SPEC.md §6's remaining columns stay NULL/default until
Phase 3).
"""

import json
import logging
import sqlite3
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.database import get_connection
from app.images import InvalidImageError, hash_bytes, new_item_id, read_and_validate, save_image
from app.models import CATEGORIES, DeleteResponse, ItemCreateResponse, ItemOut

router = APIRouter(prefix="/api/items", tags=["items"])
logger = logging.getLogger(__name__)


def _image_url(path: str | None) -> str | None:
    if not path:
        return None
    return f"/data/originals/{Path(path).name}"


def _row_to_item(row: sqlite3.Row) -> ItemOut:
    return ItemOut(
        id=row["id"],
        name=row["name"],
        category=row["category"],
        subtype=row["subtype"],
        colors=json.loads(row["colors"]),
        front_image_url=_image_url(row["original_front_path"]),
        back_image_url=_image_url(row["original_back_path"]),
        created_at=row["created_at"],
    )


@router.post("", response_model=ItemCreateResponse, status_code=201)
async def create_item(
    front: UploadFile = File(...),
    back: UploadFile | None = File(None),
    name: str = Form(...),
    category: str = Form(...),
    subtype: str | None = Form(None),
    color: str = Form("Not specified"),
):
    name = name.strip() or "New Item"
    category = category.strip()
    subtype = subtype.strip() if subtype else None
    color = color.strip() or "Not specified"

    if category not in CATEGORIES:
        raise HTTPException(400, f"Category must be one of: {', '.join(CATEGORIES)}")

    front_raw = await front.read()
    try:
        front_raw, front_ext = read_and_validate(front_raw)
    except InvalidImageError as exc:
        raise HTTPException(400, f"Front image: {exc}") from exc

    back_raw = back_ext = None
    if back is not None and back.filename:
        back_raw = await back.read()
        try:
            back_raw, back_ext = read_and_validate(back_raw)
        except InvalidImageError as exc:
            raise HTTPException(400, f"Back image: {exc}") from exc

    front_hash = hash_bytes(front_raw)

    conn = get_connection()
    try:
        existing = conn.execute(
            "SELECT * FROM items WHERE source_hash_front = ?", (front_hash,)
        ).fetchone()
        if existing is not None:
            return ItemCreateResponse(**_row_to_item(existing).model_dump(), duplicate=True)

        item_id = new_item_id()
        written_paths = []
        try:
            front_path = save_image(front_raw, front_ext, item_id, "front")
            written_paths.append(front_path)

            back_path = None
            if back_raw is not None:
                back_path = save_image(back_raw, back_ext, item_id, "back")
                written_paths.append(back_path)

            back_hash = hash_bytes(back_raw) if back_raw is not None else None

            conn.execute(
                """
                INSERT INTO items (
                    id, source_hash_front, source_hash_back, name, category,
                    subtype, colors, original_front_path, original_back_path
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    item_id,
                    front_hash,
                    back_hash,
                    name,
                    category,
                    subtype,
                    json.dumps([color]),
                    str(front_path),
                    str(back_path) if back_path else None,
                ),
            )
            conn.commit()
        except sqlite3.IntegrityError:
            for path in written_paths:
                path.unlink(missing_ok=True)
            existing = conn.execute(
                "SELECT * FROM items WHERE source_hash_front = ?", (front_hash,)
            ).fetchone()
            if existing is not None:
                return ItemCreateResponse(**_row_to_item(existing).model_dump(), duplicate=True)
            raise HTTPException(500, "Could not save item: a conflicting record exists.") from None
        except Exception as exc:
            for path in written_paths:
                path.unlink(missing_ok=True)
            raise HTTPException(500, f"Could not save item: {exc}") from exc

        created = conn.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
        return ItemCreateResponse(**_row_to_item(created).model_dump(), duplicate=False)
    finally:
        conn.close()


@router.get("", response_model=list[ItemOut])
def list_items():
    conn = get_connection()
    try:
        rows = conn.execute("SELECT * FROM items ORDER BY created_at DESC").fetchall()
        return [_row_to_item(row) for row in rows]
    finally:
        conn.close()


@router.delete("/{item_id}", response_model=DeleteResponse)
def delete_item(item_id: str):
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
        if row is None:
            raise HTTPException(404, "Item not found")

        conn.execute("DELETE FROM items WHERE id = ?", (item_id,))
        conn.commit()

        files_removed = True
        warning = None
        for path_str in (row["original_front_path"], row["original_back_path"]):
            if not path_str:
                continue
            path = Path(path_str)
            try:
                path.unlink(missing_ok=True)
            except OSError as exc:
                files_removed = False
                warning = f"Item deleted, but a file could not be removed: {exc}"
                logger.warning("Failed to remove file %s for item %s: %s", path, item_id, exc)

        return DeleteResponse(deleted=True, files_removed=files_removed, warning=warning)
    finally:
        conn.close()
