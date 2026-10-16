"""
API Integration Tests for Drift FastAPI endpoints.
Tests consent validation, profile creation, question budget retrieval,
check-in submission, dashboard aggregation with as_of parameter, and privacy deletion.
"""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.main import app
from app.db import SessionLocal
from app.models import Student

client = TestClient(app)


def test_consent_enforcement_on_profile_creation():
    """Verify that creating a profile without consent returns 400 Bad Request."""
    payload = {
        "student_id": "TEST_NOCONSENT",
        "year": 1,
        "department": "Engineering",
        "consent": False
    }
    res = client.post("/students", json=payload)
    assert res.status_code == 400
    assert "consent is required" in res.json()["detail"].lower()


def test_create_and_get_student_profile():
    """Verify creating a student with consent and retrieving their profile."""
    sid = "TEST_STUDENT_01"
    # Cleanup if previously created
    client.delete(f"/students/{sid}")

    payload = {
        "student_id": sid,
        "year": 3,
        "department": "Psychology",
        "age_range": "20-22",
        "baseline_sleep": 7.5,
        "baseline_study": 4.0,
        "consent": True
    }
    create_res = client.post("/students", json=payload)
    assert create_res.status_code == 201
    data = create_res.json()
    assert data["student_id"] == sid
    assert data["consent"] == 1

    get_res = client.get(f"/students/{sid}")
    assert get_res.status_code == 200
    assert get_res.json()["department"] == "Psychology"

    # Clean up test student
    client.delete(f"/students/{sid}")


def test_daily_question_endpoint():
    """Verify GET /checkin/question/{id} returns a valid micro-question."""
    res = client.get("/checkin/question/S001")
    assert res.status_code == 200
    data = res.json()
    assert "selected_question" in data
    assert "key" in data["selected_question"]
    assert "reason_asked" in data


def test_submit_checkin_endpoint():
    """Verify POST /checkin saves data and triggers analysis."""
    payload = {
        "student_id": "S001",
        "date": "2026-10-01",  # Existing latest date
        "mood": 4,
        "stress": 3,
        "main_factor": "Studies",
        "micro_key": "sleep",
        "micro_value": 7.0
    }
    res = client.post("/checkin", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "safety" in data


def test_dashboard_endpoint_with_as_of():
    """Verify GET /dashboard/S001 with and without as_of date parameter."""
    # 1. Latest dashboard
    res_latest = client.get("/dashboard/S001")
    assert res_latest.status_code == 200
    data = res_latest.json()
    assert "radar" in data
    assert len(data["radar"]) == 7
    assert "what_changed" in data
    assert "pattern" in data
    assert "drift" in data
    assert "safety" in data

    # 2. Time-travel to Week 5 (2026-09-06)
    res_travel = client.get("/dashboard/S001?as_of=2026-09-06")
    assert res_travel.status_code == 200
    travel_data = res_travel.json()
    assert travel_data["as_of"] == "2026-09-06"
    assert travel_data["pattern"]["primary_pattern"] is not None
    assert travel_data["pattern"]["primary_pattern"]["key"] == "academic"


def test_timeline_endpoint():
    """Verify GET /timeline/S001 returns weekly series."""
    res = client.get("/timeline/S001")
    assert res.status_code == 200
    data = res.json()
    assert "weeks" in data
    assert len(data["weeks"]) >= 8


def test_privacy_delete_student_data():
    """Verify DELETE /students/{id} completely deletes student data."""
    sid = "TEST_DELETE_ME"
    # Create
    client.post("/students", json={"student_id": sid, "consent": True})
    # Check exists
    assert client.get(f"/students/{sid}").status_code == 200
    # Delete
    del_res = client.delete(f"/students/{sid}")
    assert del_res.status_code == 200
    # Verify gone
    assert client.get(f"/students/{sid}").status_code == 404


def test_realtime_chatbot_general_query():
    """Verify POST /chat/S001 returns grounded answer for routine wellness queries."""
    res = client.post("/chat/S001", json={"question": "How is my sleep compared to baseline?"})
    assert res.status_code == 200
    data = res.json()
    assert "answer" in data
    assert len(data["answer"]) > 20
    assert "data_basis" in data
    assert "suggestions" in data
    assert "recommend_counsellor" in data
    assert data["recommend_counsellor"] is False


def test_realtime_chatbot_distress_recommends_counsellor():
    """Verify POST /chat/S001 detects distress and proactively recommends campus counsellor."""
    res = client.post("/chat/S001", json={"question": "I feel completely overwhelmed, burnt out and depressed. Can I talk to someone?"})
    assert res.status_code == 200
    data = res.json()
    assert data["recommend_counsellor"] is True
    assert data["counsellor_info"] is not None
    assert "Dr. Sarah Jenkins" in data["counsellor_info"]["name"]
    assert "phone" in data["counsellor_info"]
    assert "Room 204" in data["counsellor_info"]["location"]
    assert data["counsellor_urgency"] in ["soft", "firm"]


def test_counsellor_booking_flow():
    """Verify POST /chat/book-counsellor reserves a confidential session."""
    payload = {
        "student_id": "S001",
        "slot": "Tomorrow 10:00 AM",
        "urgency": "Elevated",
        "note": "Exam period support",
        "contact_method": "In-person (Room 204)"
    }
    res = client.post("/chat/book-counsellor", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "APPT-" in data["booking_id"]
    assert data["status"] == "Confirmed"
    assert data["student_id"] == "S001"
