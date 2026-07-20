"""Safe handling of uploaded garment photos.

Never trusts the client-supplied filename or Content-Type: the actual image
type is sniffed from the file bytes, and stored filenames are always
server-generated (UUID-based), so nothing derived from user input ever
becomes part of a filesystem path.
"""

import hashlib
import io
import uuid
from pathlib import Path

from PIL import Image, UnidentifiedImageError

from app.config import settings

ALLOWED_FORMATS = {"JPEG": "jpg", "PNG": "png", "WEBP": "webp"}


class InvalidImageError(ValueError):
    """Raised when an upload isn't a supported image or exceeds the size limit."""


def read_and_validate(raw: bytes) -> tuple[bytes, str]:
    """Validate uploaded bytes are a supported image within the size limit.

    Returns (raw_bytes, file_extension). Raises InvalidImageError otherwise.
    """
    if not raw:
        raise InvalidImageError("Uploaded file is empty.")
    if len(raw) > settings.max_upload_bytes:
        max_mb = settings.max_upload_bytes / (1024 * 1024)
        raise InvalidImageError(f"Image exceeds the {max_mb:.0f} MB size limit.")

    try:
        with Image.open(io.BytesIO(raw)) as img:
            img.verify()
        with Image.open(io.BytesIO(raw)) as img:
            fmt = img.format
    except UnidentifiedImageError as exc:
        raise InvalidImageError("File is not a supported image.") from exc

    if fmt not in ALLOWED_FORMATS:
        raise InvalidImageError(
            f"Unsupported image type '{fmt}'. Use JPEG, PNG, or WebP."
        )

    return raw, ALLOWED_FORMATS[fmt]


def hash_bytes(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def save_image(raw: bytes, ext: str, item_id: str, slot: str) -> Path:
    """Write validated image bytes to data/originals/ under a safe, server-generated name."""
    settings.originals_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{item_id}_{slot}.{ext}"
    path = settings.originals_dir / filename
    path.write_bytes(raw)
    return path


def new_item_id() -> str:
    return str(uuid.uuid4())
