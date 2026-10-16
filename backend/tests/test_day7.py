"""
Unit and Integration tests for Day 7: Personal Levers, Counsellor View (k-anonymity),
Random Forest, and Evaluation results endpoint.
"""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.engines.levers import compute_personal_levers
from app.main import app

client = TestClient(app)


def test_personal_levers_computation():
    """Verify personal levers correctly detects next-day stress contrast."""
    records = []
    # Block 1 (Days 1-10): Slept 8.0h -> next day stress 2
    for i in range(10):
        records.append({
            "date": f"2026-09-{i+1:02d}",
            "sleep": 8.0,
            "stress": 2
        })
    # Block 2 (Days 11-20): Slept 5.0h -> next day stress 4
    for i in range(10, 20):
        records.append({
            "date": f"2026-09-{i+1:02d}",
            "sleep": 5.0,
            "stress": 4
        })

    lever = compute_personal_levers(records, sleep_median=6.5)
    assert lever["has_lever"] is True
    assert lever["diff"] > 0
    assert "tended to be" in lever["statement"].lower()
    assert "not proof of cause" in lever["disclaimer"].lower()


def test_counsellor_view_k_anonymity():
    """Verify GET /counsellor/summary enforces k >= 5 anonymity threshold."""
    res = client.get("/counsellor/summary")
    assert res.status_code == 200
    data = res.json()
    assert "departments" in data
    assert data["k_anonymity_threshold"] >= 5

    # Check each returned group has at least 5 students
    for dept in data["departments"]:
        assert dept["student_count"] >= 5
        assert "avg_stress" in dept
        assert "elevated_stress_pct" in dept


def test_eval_results_endpoint():
    """Verify GET /eval/results returns generated experiment results."""
    res = client.get("/eval/results")
    assert res.status_code == 200
    data = res.json()
    assert "detection_delay" in data
    assert "question_burden" in data
    assert data["question_burden"]["reduction_percent"] > 50
