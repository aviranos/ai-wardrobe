from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import check_connection

APP_VERSION = "0.1.0"


@asynccontextmanager
async def lifespan(app: FastAPI):
    check_connection()
    yield


app = FastAPI(title="AI Wardrobe API", version=APP_VERSION, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict:
    return {
        "status": "ok",
        "version": APP_VERSION,
        "database": "connected" if check_connection() else "error",
    }
