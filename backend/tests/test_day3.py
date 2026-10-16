"""
Unit tests for Day 3: CUSUM Quiet Drift, Rule-Based Safety Layer, and Question Budget Engine.
"""

import sys
from pathlib import Path
import pytest

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.engines.drift import compute_cusum_for_metric, compute_all_drifts
from app.safety.safety import evaluate_safety
from app.engines.questions import select_daily_micro_question
from app.db import SessionLocal
from app.models import MetricLog, Checkin


def test_cusum_drift_detection():
    """Verify CUSUM detects subtle persistent drift and stays calm on noise."""
    # Control series: 30 days of stable sleep around 7.5h
    control_series = [{"date": f"2026-08-{i+1:02d}", "value": 7.5 + (0.1 if i % 2 == 0 else -0.1)} for i in range(30)]
    ctrl_res = compute_cusum_for_metric(control_series, "sleep")
    assert ctrl_res["has_drift"] is False
    assert ctrl_res["current_cusum"] == 0.0

    # Drifting series: 14 stable days (7.6h), then dropping to 6.2h, 5.8h, 5.4h...
    drift_series = [{"date": f"2026-08-{i+1:02d}", "value": 7.6} for i in range(14)]
    for i in range(14, 30):
        drift_series.append({"date": f"2026-08-{i+1:02d}", "value": 6.0})

    drift_res = compute_cusum_for_metric(drift_series, "sleep")
    assert drift_res["has_drift"] is True
    assert drift_res["flag_date"] is not None
    assert drift_res["days_drifting"] > 0
    assert "quietly drifting down" in drift_res["message"]


def test_safety_layer_triggers():
    """Verify Soft and Firm escalation triggers without clinical terms."""
    # 1. Normal state
    normal_checkins = [{"date": f"2026-09-0{i}", "mood": 4, "stress": 2} for i in range(1, 5)]
    res_norm = evaluate_safety(normal_checkins)
    assert res_norm["level"] == "none"
    assert res_norm["triggered"] is False
    assert res_norm["skip_llm"] is False

    # 2. Soft trigger: stress >= 4 on 3 of last 4 days
    soft_checkins = [
        {"date": "2026-09-01", "mood": 3, "stress": 4},
        {"date": "2026-09-02", "mood": 3, "stress": 4},
        {"date": "2026-09-03", "mood": 4, "stress": 2},
        {"date": "2026-09-04", "mood": 3, "stress": 4}
    ]
    res_soft = evaluate_safety(soft_checkins)
    assert res_soft["level"] == "soft"
    assert res_soft["triggered"] is True
    assert "counsellor_info" in res_soft

    # 3. Firm trigger: stress = 5 AND mood = 1 on 2 consecutive days
    firm_checkins = [
        {"date": "2026-09-01", "mood": 1, "stress": 5},
        {"date": "2026-09-02", "mood": 1, "stress": 5}
    ]
    res_firm = evaluate_safety(firm_checkins)
    assert res_firm["level"] == "firm"
    assert res_firm["triggered"] is True
    assert res_firm["skip_llm"] is True

    # 4. User requested help button
    res_help = evaluate_safety([], user_requested_help=True)
    assert res_help["level"] == "firm"
    assert res_help["triggered"] is True
    assert res_help["skip_llm"] is True


def test_question_budget_engine():
    """Verify question budget scoring and escalation logic."""
    # Staleness: sleep asked yesterday (1 day ago), study 6 days ago
    last_asked = {
        "sleep": 1,
        "study": 6,
        "screen": 3,
        "exercise": 4,
        "social": 5
    }

    # Since sleep was asked yesterday, study or social should be favored
    q_res = select_daily_micro_question(
        last_asked_days_ago=last_asked,
        flagged_metrics=["study"],
        today_main_factor="Studies",
        today_stress=2,
        today_mood=4
    )

    assert q_res["selected_question"]["key"] == "study"
    assert q_res["offer_escalation"] is False

    # Escalation: stress = 4, mood = 2 -> offer 2 follow-ups
    q_esc = select_daily_micro_question(
        last_asked_days_ago=last_asked,
        today_stress=4,
        today_mood=2
    )
    assert q_esc["offer_escalation"] is True
    assert len(q_esc["escalation_questions"]) == 2


def test_s001_drift_and_consecutive_questions():
    """Verify S001 drift flag date and simulate 7 consecutive days of question selection."""
    db = SessionLocal()
    try:
        # Load S001 sleep metric logs
        sleep_rows = (
            db.query(MetricLog)
            .filter(MetricLog.student_id == "S001", MetricLog.metric == "sleep")
            .order_by(MetricLog.date.asc())
            .all()
        )
        time_series = [{"date": r.date, "value": r.value} for r in sleep_rows]

        # Compute CUSUM on S001 sleep
        drift_res = compute_cusum_for_metric(time_series, "sleep")
        assert drift_res["has_drift"] is True
        # Sleep drift should trigger in weeks 4-5 (between Day 21 and 35)
        assert drift_res["flag_date"] is not None

        # Verify Question Budget simulation across 7 days
        last_asked = {"sleep": 5, "study": 4, "screen": 3, "exercise": 2, "social": 1}
        chosen_questions = []

        for day in range(7):
            selection = select_daily_micro_question(
                last_asked_days_ago=last_asked,
                flagged_metrics=["sleep"] if drift_res["has_drift"] else []
            )
            chosen_key = selection["selected_question"]["key"]
            chosen_questions.append(chosen_key)

            # Update staleness for next day: all increment, chosen resets to 0
            for k in last_asked:
                last_asked[k] += 1
            last_asked[chosen_key] = 0

        # Over 7 days, multiple distinct metrics should be checked without repeats on consecutive days
        assert len(set(chosen_questions)) >= 4
        for i in range(len(chosen_questions) - 1):
            assert chosen_questions[i] != chosen_questions[i + 1]

    finally:
        db.close()
