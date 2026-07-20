from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import check_connection, init_db
from app.items import router as items_router

APP_VERSION = "0.1.0"


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    check_connection()
    yield


settings.originals_dir.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="AI Wardrobe API", version=APP_VERSION, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(items_router)
app.mount("/data/originals", StaticFiles(directory=settings.originals_dir), name="originals")


@app.get("/api/health")
def health() -> dict:
    return {
        "status": "ok",
        "version": APP_VERSION,
        "database": "connected" if check_connection() else "error",
    }
