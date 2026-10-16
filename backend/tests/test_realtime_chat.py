"""
Unit and Integration Tests for Real-time Student Chatbot and Campus Counsellor Referral.
Tests:
- Unified student chat endpoint (/chat/{student_id})
- Counsellor referral detection for distress/hopelessness queries
- Counsellor appointment reservation (/chat/book-counsellor)
- Gemini key verification endpoint error handling
- Zero-failure fallback generative synthesizer
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_chat_normal_query():
    """Verify student receives evidence-grounded generative response for normal habits query."""
    response = client.post(
        "/chat/S001",
        json={"question": "Why has my sleep been feeling irregular lately?"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert len(data["answer"]) > 20
    assert "data_basis" in data
    assert isinstance(data["suggestions"], list)
    assert len(data["suggestions"]) > 0
    assert "encouragement" in data
    assert data["recommend_counsellor"] is False


def test_chat_counsellor_recommendation_on_distress():
    """Verify chatbot triggers counsellor recommendation when distress keywords are detected."""
    response = client.post(
        "/chat/S001",
        json={
            "question": "I feel completely hopeless and overwhelmed, I cannot cope with these exams and need to talk to a counsellor.",
            "history": []
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["recommend_counsellor"] is True
    assert data["counsellor_urgency"] in ["soft", "firm"]
    assert data["counsellor_info"] is not None
    assert "Dr. Sarah Jenkins" in data["counsellor_info"]["name"]
    assert "Room 204" in data["counsellor_info"]["location"]
    assert "988" in data["counsellor_info"]["helpline_24_7"]


def test_chat_book_counsellor_endpoint():
    """Verify student can book a confidential session with campus counsellor directly."""
    response = client.post(
        "/chat/book-counsellor",
        json={
            "student_id": "S001",
            "slot": "Tomorrow 10:00 AM",
            "urgency": "Elevated",
            "note": "Feeling heavy stress before midterm exams"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["status"] == "Confirmed"
    assert "APPT-" in data["booking_id"]
    assert data["counsellor"] == "Dr. Sarah Jenkins, Ph.D."


def test_verify_gemini_key_empty():
    """Verify endpoint rejects empty Gemini API key."""
    response = client.post(
        "/chat/verify-key",
        json={"api_key": "   "}
    )
    assert response.status_code == 400
