import socket

from tests.conftest import make_image_bytes


def _upload(client, *, front=True, back=False, front_fmt="JPEG", **fields):
    files = {}
    if front:
        files["front"] = ("front.jpg", make_image_bytes(front_fmt, color="blue"), "image/jpeg")
    if back:
        files["back"] = ("back.jpg", make_image_bytes("JPEG", color="red"), "image/jpeg")
    data = {"name": "Test Shirt", "category": "top", "color": "blue", **fields}
    return client.post("/api/items", files=files, data=data)


def test_create_item_with_front_image(client):
    response = _upload(client)

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Test Shirt"
    assert body["category"] == "top"
    assert body["subtype"] is None
    assert body["colors"] == ["blue"]
    assert body["front_image_url"].startswith("/data/originals/")
    assert body["back_image_url"] is None
    assert body["duplicate"] is False


def test_create_item_with_optional_type(client):
    response = _upload(client, subtype="T-shirt")

    assert response.status_code == 201
    assert response.json()["subtype"] == "T-shirt"


def test_create_item_with_optional_back_image(client):
    response = _upload(client, back=True)

    assert response.status_code == 201
    body = response.json()
    assert body["back_image_url"] is not None
    assert body["back_image_url"] != body["front_image_url"]


def test_reject_missing_front_image(client):
    response = client.post(
        "/api/items",
        files={},
        data={"name": "No Front", "category": "top", "color": "blue"},
    )

    assert response.status_code == 422


def test_reject_unsupported_upload(client):
    response = client.post(
        "/api/items",
        files={"front": ("notes.txt", b"this is not an image", "text/plain")},
        data={"name": "Bad Upload", "category": "top", "color": "blue"},
    )

    assert response.status_code == 400


def test_list_items(client):
    _upload(client)
    _upload(client, front_fmt="PNG")  # different bytes -> different hash, not a duplicate

    response = client.get("/api/items")

    assert response.status_code == 200
    assert len(response.json()) == 2


def test_item_persists_after_refresh(client):
    create_response = _upload(client)
    item_id = create_response.json()["id"]

    # Simulate the frontend re-fetching after a browser refresh: a fresh
    # request against the same running app/database, not the same objects.
    refreshed = client.get("/api/items")

    assert any(item["id"] == item_id for item in refreshed.json())


def test_delete_item(client):
    create_response = _upload(client)
    item_id = create_response.json()["id"]

    response = client.delete(f"/api/items/{item_id}")

    assert response.status_code == 200
    body = response.json()
    assert body["deleted"] is True
    assert body["files_removed"] is True


def test_delete_removes_database_record_and_image_files(client):
    from app.config import settings

    create_response = _upload(client, back=True)
    item_id = create_response.json()["id"]
    front_files = list(settings.originals_dir.glob(f"{item_id}_front.*"))
    back_files = list(settings.originals_dir.glob(f"{item_id}_back.*"))
    assert front_files and back_files

    client.delete(f"/api/items/{item_id}")

    assert not any(item["id"] == item_id for item in client.get("/api/items").json())
    assert not front_files[0].exists()
    assert not back_files[0].exists()


def test_duplicate_front_image_returns_existing_item_not_a_new_one(client):
    first = _upload(client)
    second = _upload(client)  # identical front image bytes

    assert first.json()["id"] == second.json()["id"]
    assert second.json()["duplicate"] is True
    assert len(client.get("/api/items").json()) == 1


def test_no_paid_ai_calls_during_create(client, monkeypatch):
    def _blocked_connect(*args, **kwargs):
        raise AssertionError("Outbound network connection attempted during item creation")

    monkeypatch.setattr(socket.socket, "connect", _blocked_connect)

    response = _upload(client)

    assert response.status_code == 201
