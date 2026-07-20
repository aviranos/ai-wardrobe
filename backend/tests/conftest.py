import io

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.config import settings
from app.main import app


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "database_path", tmp_path / "test.db")
    monkeypatch.setattr(settings, "originals_dir", tmp_path / "originals")
    with TestClient(app) as test_client:
        yield test_client


def make_image_bytes(fmt: str = "JPEG", color: str = "blue") -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (20, 20), color=color).save(buf, format=fmt)
    return buf.getvalue()
