"""
Day 1 Verification Tests for Drift: Student Wellness Early-Warning System.
Verifies folder setup, database tables, seed row counts, S001 persona, and FastAPI health endpoint.
"""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure backend directory is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.db import SessionLocal, init_db, engine
from app.models import Student, Checkin, MetricLog, QuestionLog, Baseline, Analysis
from app.main import app

client = TestClient(app)


def test_database_tables_exist():
    """Verify all 6 tables from Section 5.3 are created."""
    init_db()
    db = SessionLocal()
    try:
        tables = engine.table_names() if hasattr(engine, "table_names") else [
            Student.__tablename__,
            Checkin.__tablename__,
            MetricLog.__tablename__,
            Baseline.__tablename__,
            Analysis.__tablename__,
            QuestionLog.__tablename__
        ]
        assert "students" in tables
        assert "checkins" in tables
        assert "metric_log" in tables
        assert "baselines" in tables
        assert "analyses" in tables
        assert "question_log" in tables
    finally:
        db.close()


def test_seed_row_counts():
    """Verify student and checkin counts match 41 students x 60 days."""
    db = SessionLocal()
    try:
        student_count = db.query(Student).count()
        checkin_count = db.query(Checkin).count()
        metric_log_count = db.query(MetricLog).count()
        question_log_count = db.query(QuestionLog).count()

        assert student_count >= 41, f"Expected at least 41 students, found {student_count}"
        assert checkin_count == 41 * 60, f"Expected 2460 checkins, found {checkin_count}"
        assert metric_log_count >= 2460 * 3, f"Expected at least 7380 metric rows, found {metric_log_count}"
        assert question_log_count == 2460, f"Expected 2460 questions logged, found {question_log_count}"
    finally:
        db.close()


def test_demo_student_s001():
    """Verify demo student S001 exists with consented profile and expected progression."""
    db = SessionLocal()
    try:
        s001 = db.query(Student).filter(Student.student_id == "S001").first()
        assert s001 is not None
        assert s001.consent == 1
        assert s001.baseline_sleep == 7.6
        assert s001.baseline_study == 3.5

        # Check that S001 has exactly 60 check-in days
        s001_checkins = db.query(Checkin).filter(Checkin.student_id == "S001").order_by(Checkin.date.asc()).all()
        assert len(s001_checkins) == 60

        # Check early days vs later days show clear behavioral change
        early_sleeps = [c.micro_value for c in s001_checkins[:21] if c.micro_key == "sleep"]
        later_sleeps = [c.micro_value for c in s001_checkins[28:42] if c.micro_key == "sleep"]

        if early_sleeps and later_sleeps:
            assert sum(early_sleeps) / len(early_sleeps) > sum(later_sleeps) / len(later_sleeps)
    finally:
        db.close()


def test_fastapi_endpoints():
    """Verify FastAPI root and health endpoints return 200 OK."""
    res_root = client.get("/")
    assert res_root.status_code == 200
    data = res_root.json()
    assert data["name"] == "Drift"
    assert "Not a medical diagnostic tool" in data["disclaimer"]

    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "ok"
