import logging
import uuid
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import engine, Base
from app.api.auth import router as auth_router
from app.api.workflows import router as workflows_router
from app.api.runs import router as runs_router
from app.api.reproduction import router as repro_router
from app.api.provenance import router as prov_router
from app.api.datasets import router as datasets_router
from app.api.artifacts import router as artifacts_router
from app.api.infrastructure import router as infra_router
from app.seed_data import seed_initial_database

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s (%(process)d): %(message)s"
)
logger = logging.getLogger("reprovia")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing REPROVIA backend database...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    logger.info("Seeding scientific research templates and runs...")
    await seed_initial_database()
    logger.info("REPROVIA initialization complete. Ready for computational research.")
    yield

app = FastAPI(
    title="REPROVIA — Reproducible Science Infrastructure",
    description="Production-grade API for reproducible computational workflows, containerized execution, and immutable provenance.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware for Request IDs and structured response times
@app.middleware("http")
async def add_process_time_and_request_id(request: Request, call_next):
    req_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Request-ID"] = req_id
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    return response

# Include all API routers
app.include_router(auth_router)
app.include_router(workflows_router)
app.include_router(runs_router)
app.include_router(repro_router)
app.include_router(prov_router)
app.include_router(datasets_router)
app.include_router(artifacts_router)
app.include_router(infra_router)

@app.get("/health", tags=["system"])
async def health_check():
    """Health check endpoint for Kubernetes livenessProbe."""
    return {"status": "healthy", "timestamp": time.time()}

@app.get("/ready", tags=["system"])
async def readiness_check():
    """Readiness check endpoint for Kubernetes readinessProbe."""
    return {"status": "ready", "execution_mode": settings.EXECUTION_MODE}

@app.get("/", tags=["system"])
async def root():
    return {
        "service": "REPROVIA — Reproducible Science Infrastructure",
        "institution": "CERN / Open Science Platform",
        "docs": "/docs",
        "version": "1.0.0"
    }
