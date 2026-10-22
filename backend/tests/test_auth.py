"""
Unit and integration tests for Multi-Role Authentication API.
Tests Student, Counsellor, and Admin login, registration, and telemetry.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_student_login_success():
    """Verify demo student S001 can authenticate with passcode."""
    res = client.post("/auth/login", json={
        "role": "student",
        "identifier": "S001",
        "password": "student123"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "student"
    assert data["user"]["student_id"] == "S001"
    assert "token" in data


def test_student_login_missing_password():
    """Verify student login fails when password is missing."""
    res = client.post("/auth/login", json={
        "role": "student",
        "identifier": "S001",
        "password": ""
    })
    assert res.status_code == 401


def test_student_login_not_found():
    """Verify non-existent student returns 404."""
    res = client.post("/auth/login", json={
        "role": "student",
        "identifier": "NON_EXISTENT_999",
        "password": "pass123"
    })
    assert res.status_code == 404


def test_counsellor_login_success():
    """Verify campus counsellor can authenticate with demo credentials."""
    res = client.post("/auth/login", json={
        "role": "counsellor",
        "identifier": "counsellor@campus.edu",
        "password": "counsellor123"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "counsellor"
    assert "token" in data
    assert "k-anonymity" in data["message"]


def test_admin_login_success():
    """Verify system administrator can authenticate with demo credentials."""
    res = client.post("/auth/login", json={
        "role": "admin",
        "identifier": "admin@campus.edu",
        "password": "admin123"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "admin"
    assert "token" in data


def test_admin_system_stats():
    """Verify admin stats endpoint returns telemetry and table row counts."""
    res = client.get("/auth/admin/stats")
    assert res.status_code == 200
    data = res.json()
    assert data["system_status"] == "operational"
    assert data["total_students"] >= 1
    assert data["total_checkins_logged"] >= 1
    assert isinstance(data["tracked_departments"], list)
