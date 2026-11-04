import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import reports
import templates
from config import settings
from db import run_migrations

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.env == "development":
        logger.info("Running database migrations")
        run_migrations()
    yield


app = FastAPI(title="Rapid Radiology API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(templates.router)
app.include_router(reports.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
