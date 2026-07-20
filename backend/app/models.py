"""Request/response shapes for the items API."""

from pydantic import BaseModel

CATEGORIES = ["top", "bottom", "outerwear", "dress", "one_piece", "shoes", "accessory"]


class ItemOut(BaseModel):
    id: str
    name: str
    category: str
    subtype: str | None
    colors: list[str]
    front_image_url: str
    back_image_url: str | None
    created_at: str


class ItemCreateResponse(ItemOut):
    duplicate: bool


class DeleteResponse(BaseModel):
    deleted: bool
    files_removed: bool
    warning: str | None = None
