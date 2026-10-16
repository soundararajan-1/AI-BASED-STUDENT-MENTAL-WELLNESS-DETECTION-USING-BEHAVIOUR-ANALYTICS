"""
Unit tests for Day 2: Baseline, What Changed, and Patterns Engines.
Tests cover:
- Cold-start student with under 7 days of data
- Stable student with balanced patterns
- Declining student triggering Academic workload pattern
- Demo student S001 JSON verification at Week 2 and Week 5
"""

import sys
from pathlib import Path
import pytest
import json

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.engines.baseline import compute_baseline_for_metric, compute_all_baselines
from app.engines.changes import compute_changes
from app.engines.patterns import detect_patterns
from app.db import SessionLocal
from app.models import MetricLog


def test_cold_start_student():
    """Test behavior when student has fewer than 7 days of data."""
    # Only 4 observations (cold start)
    observations = [
        {"days_ago': 0, 'value": 7.0},
        {"days_ago': 1, 'value": 7.5},
        {"days_ago': 2, 'value": 7.2},
        {"days_ago': 3, 'value": 7.3}
    ]
    # Clean keys
    obs = [{"days_ago": i, "value": v} for i, v in enumerate([7.0, 7.5, 7.2, 7.3])]
    result = compute_baseline_for_metric(obs, "sleep")

    assert result["confidence"] == round(4 / 14.0, 2)
    assert result["suppress_alerts"] is True
    assert "Still learning your normal" in result["status"]
    assert result["band_low"] is not None
    assert result["band_high"] is not None


def test_stable_student_balanced_pattern():
    """Test stable student produces high confidence and Balanced pattern match."""
    # 21 days of stable sleep and stress
    sleep_obs = [{"days_ago": i, "value": 7.5 + (0.1 if i % 2 == 0 else -0.1)} for i in range(21)]
    stress_obs = [{"days_ago": i, "value": 2.0} for i in range(21)]
    study_obs = [{"days_ago": i, "value": 3.5} for i in range(21)]
    mood_obs = [{"days_ago": i, "value": 4.0} for i in range(21)]

    history = {
        "sleep": sleep_obs,
        "stress": stress_obs,
        "study": study_obs,
        "mood": mood_obs
    }

    baselines = compute_all_baselines(history)
    assert baselines["sleep"]["confidence"] == 1.0
    assert baselines["sleep"]["suppress_alerts"] is False
    assert abs(baselines["sleep"]["z"]) < 0.5

    # Check patterns
    pattern_res = detect_patterns(baselines)
    assert pattern_res["primary_pattern"] is not None
    assert pattern_res["primary_pattern"]["key"] == "balanced"
    assert "balanced" in pattern_res["primary_pattern"]["name"].lower()


def test_declining_student_academic_pattern():
    """Test declining student triggers Academic workload pattern and What Changed flags."""
    # Baseline for first 2 weeks, then study up, sleep down, stress up in recent days
    sleep_obs = [{"days_ago": i, "value": 5.0 if i < 4 else 7.5} for i in range(21)]
    study_obs = [{"days_ago": i, "value": 6.8 if i < 4 else 3.5} for i in range(21)]
    stress_obs = [{"days_ago": i, "value": 4.5 if i < 4 else 2.0} for i in range(21)]

    history = {
        "sleep": sleep_obs,
        "study": study_obs,
        "stress": stress_obs
    }

    baselines = compute_all_baselines(history)
    assert baselines["sleep"]["z"] <= -1.0
    assert baselines["study"]["z"] >= 1.0
    assert baselines["stress"]["z"] >= 1.0

    # Patterns
    patterns = detect_patterns(baselines)
    assert patterns["primary_pattern"] is not None
    assert patterns["primary_pattern"]["key"] == "academic"
    assert len(patterns["primary_pattern"]["evidence"]) >= 2

    # What Changed
    changes = compute_changes(history, baselines)
    assert changes["meaningful_count"] >= 2
    metrics_changed = [c["metric"] for c in changes["changes"] if c["is_meaningful"]]
    assert "sleep" in metrics_changed or "study" in metrics_changed


def test_s001_week2_vs_week5():
    """Verify demo student S001 output at Week 2 (stable) and Week 5 (declining)."""
    db = SessionLocal()
    try:
        # Load S001's metric logs
        rows = db.query(MetricLog).filter(MetricLog.student_id == "S001").order_by(MetricLog.date.asc()).all()
        dates = sorted(list(set(r.date for r in rows)))

        # Week 2 date (Day 13)
        week2_date = dates[13]
        # Week 5 date (Day 34)
        week5_date = dates[34]

        def get_history_as_of(target_date: str):
            history = {}
            target_idx = dates.index(target_date)
            for r in rows:
                if r.date <= target_date:
                    r_idx = dates.index(r.date)
                    days_ago = target_idx - r_idx
                    if days_ago <= 28:
                        if r.metric not in history:
                            history[r.metric] = []
                        history[r.metric].append({"days_ago": days_ago, "value": r.value})
            return history

        # Week 2 evaluation
        h_w2 = get_history_as_of(week2_date)
        b_w2 = compute_all_baselines(h_w2)
        p_w2 = detect_patterns(b_w2)

        # In Week 2, S001 is stable -> Academic pattern should NOT match
        matched_keys_w2 = [p["key"] for p in p_w2["all_matched_patterns"]]
        assert "academic" not in matched_keys_w2

        # Reference history from first 3 stable weeks (Days 0-20)
        ref_history = {}
        for r in rows:
            r_idx = dates.index(r.date)
            if r_idx < 21:
                if r.metric not in ref_history:
                    ref_history[r.metric] = []
                ref_history[r.metric].append({"days_ago": 20 - r_idx, "value": r.value})

        # Week 5 evaluation
        h_w5 = get_history_as_of(week5_date)
        b_w5 = compute_all_baselines(h_w5, reference_history=ref_history)
        p_w5 = detect_patterns(b_w5)

        # In Week 5, S001 is under academic workload pressure
        matched_keys_w5 = [p["key"] for p in p_w5["all_matched_patterns"]]
        assert "academic" in matched_keys_w5
        assert p_w5["primary_pattern"]["key"] == "academic"

        # Check evidence receipts exist
        assert len(p_w5["primary_pattern"]["evidence"]) >= 2

    finally:
        db.close()
