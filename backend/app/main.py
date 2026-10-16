"""
FastAPI Main Application for AI-Based Student Mental Wellness Detection Using Behaviour Analytics.
Provides REST API endpoints, CORS handling, automatic database initialization, and health monitoring.
Notice: Educational wellness-support prototype. Not a medical diagnostic tool.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import sys
from pathlib import Path

# Ensure backend directory is in sys.path regardless of execution working directory
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.db import init_db
from app.api import students, checkins, dashboard, counsellor, auth, ask


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database tables on application startup."""
    init_db()
    yield


app = FastAPI(
    title="AI-Based Student Mental Wellness Detection API",
    description="Backend service for AI-Based Student Mental Wellness Detection Using Behaviour Analytics. "
                "Learns student personal baselines, identifies meaningful behavioral changes, and provides "
                "non-clinical wellness guidance. Prototype only.",
    version="1.0.0",
    lifespan=lifespan
)

import os

cors_env = os.getenv("CORS_ORIGINS", "")
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
if cors_env:
    for origin in cors_env.split(","):
        stripped = origin.strip()
        if stripped and stripped not in allowed_origins:
            allowed_origins.append(stripped)

# CORS middleware for local frontend development and cloud deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=os.getenv("CORS_ORIGIN_REGEX", r"https://.*(vercel\.app|onrender\.com|netlify\.app)"),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(checkins.router)
app.include_router(dashboard.router)
app.include_router(counsellor.router)
app.include_router(ask.router)


@app.get("/")
def read_root():
    """Project metadata root endpoint."""
    return {
        "name": "Drift",
        "project": "AI-Based Student Mental Wellness Detection Using Behaviour Analytics",
        "description": "Personalized behaviour analytics and quiet drift early-warning system for higher education",
        "status": "operational",
        "active_phase": "All Phases Complete — Demo Ready",
        "docs_url": "/docs",
        "health_url": "/health",
        "disclaimer": "Educational wellness-support prototype. Not a medical diagnostic tool."
    }


@app.get("/health")
def health_check():
    """System health check endpoint."""
    return {
        "status": "ok",
        "service": "AI-Based Student Mental Wellness Detection API",
        "version": "1.0.0",
        "environment": "development",
        "phase": "All Phases Complete — Demo Ready",
        "database_configured": True,
        "ml_model_status": "ready",
        "disclaimer": "Educational wellness-support prototype. Not a medical diagnostic tool."
    }


@app.get("/eval/results")
def get_evaluation_results():
    """Returns experimental evaluation results comparing personal baselines with fixed thresholds."""
    import json
    from pathlib import Path
    results_path = Path(__file__).resolve().parent.parent / "evaluation" / "results" / "evaluation_summary.json"
    if results_path.exists():
        with open(results_path, "r") as f:
            return json.load(f)
    return {"status": "pending", "message": "Evaluation results not yet generated."}
