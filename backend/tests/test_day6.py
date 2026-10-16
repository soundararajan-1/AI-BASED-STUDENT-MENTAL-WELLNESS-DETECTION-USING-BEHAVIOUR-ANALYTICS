"""
Unit tests for Day 6: LLM layer, Validator, Evidence Receipts, and Pattern Memory.
"""

import sys
from pathlib import Path
import pytest

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.llm.validator import validate_llm_response
from app.llm.templates import generate_template_insight
from app.llm.client import generate_wellness_insight
from app.engines.memory import compute_pattern_memory


def test_validator_rejects_banned_words():
    """Verify validator rejects medical diagnostic words."""
    facts = {"sleep": 6.5, "study": 4.0}

    # Banned words
    bad_output_1 = "The student shows signs of depression and extreme lethargy."
    valid_1, reason_1 = validate_llm_response(bad_output_1, facts)
    assert valid_1 is False
    assert "banned term" in reason_1.lower()

    bad_output_2 = "This pattern could indicate an anxiety disorder."
    valid_2, reason_2 = validate_llm_response(bad_output_2, facts)
    assert valid_2 is False
    assert "banned term" in reason_2.lower()

    bad_output_3 = "Formal clinical diagnosis is recommended."
    valid_3, reason_3 = validate_llm_response(bad_output_3, facts)
    assert valid_3 is False


def test_validator_rejects_invented_numbers():
    """Verify validator rejects hallucinated numbers not in input facts."""
    # Facts only have 6.5 and 4.0
    facts = {
        "sleep": 6.5,
        "study": 4.0,
        "changes": [{"metric": "sleep", "delta": -1.2}]
    }

    # 8.9 was never mentioned in the facts
    hallucinated = "Your screen time surged to 8.9 hours, which explains your sleep shift."
    is_valid, reason = validate_llm_response(hallucinated, facts)
    assert is_valid is False
    assert "hallucinated number" in reason.lower()

    # Grounded response using facts (6.5h and delta -1.2)
    grounded = "Your sleep dropped by 1.2 hours to 6.5 hours this week."
    is_valid_grounded, _ = validate_llm_response(grounded, facts)
    assert is_valid_grounded is True


def test_offline_template_fallback_works_without_api_key():
    """Verify system generates rich explanation receipts even with no API key."""
    facts = {
        "as_of": "2026-09-06",
        "changes": [
            {
                "metric": "sleep",
                "recent_mean": 5.2,
                "prev_mean": 7.5,
                "delta": -2.3,
                "arrow": "↓"
            }
        ],
        "pattern": {
            "name": "Academic workload-related pattern",
            "description": "Extended study hours and reduced rest.",
            "evidence": ["Study hours are high", "Sleep hours are low"]
        },
        "drift": {
            "has_drift": True,
            "metric": "sleep",
            "message": "Your sleep has been drifting down for about 18 days.",
            "current_cusum": 4.8,
            "flag_date": "2026-09-01"
        }
    }

    insight = generate_wellness_insight(facts)
    assert insight is not None
    assert "what_changed" in insight
    assert "receipts" in insight
    assert len(insight["receipts"]) >= 3
    # Check that each receipt has sentence, claim, and evidence
    for r in insight["receipts"]:
        assert "sentence" in r
        assert "claim" in r
        assert len(r["evidence"]) > 0


def test_pattern_memory_finds_similar_past_week():
    """Verify pattern memory computes vector distance and identifies similar past weeks."""
    baselines = {
        "mood": {"median": 4.0, "spread": 0.5},
        "stress": {"median": 2.0, "spread": 0.5},
        "sleep": {"median": 7.5, "spread": 0.5},
        "study": {"median": 3.5, "spread": 0.5},
        "screen": {"median": 4.5, "spread": 0.5},
        "exercise": {"median": 35.0, "spread": 5.0},
        "social": {"median": 4.0, "spread": 0.5}
    }

    weekly_history = [
        {"week": 1, "label": "Week 1", "mood": 4.0, "stress": 2.0, "sleep": 7.5, "study": 3.5, "screen": 4.5, "exercise": 35.0, "social": 4.0},
        {"week": 2, "label": "Week 2", "mood": 3.0, "stress": 4.0, "sleep": 5.5, "study": 6.5, "screen": 6.0, "exercise": 15.0, "social": 2.0},
        {"week": 3, "label": "Week 3", "mood": 4.0, "stress": 2.0, "sleep": 7.4, "study": 3.6, "screen": 4.4, "exercise": 34.0, "social": 4.1},
        # Current Week 4 closely resembles Week 1 and Week 3
        {"week": 4, "label": "Week 4", "mood": 4.1, "stress": 2.1, "sleep": 7.5, "study": 3.5, "screen": 4.5, "exercise": 35.0, "social": 4.0}
    ]

    mem_res = compute_pattern_memory(weekly_history, baselines)
    assert mem_res["has_memory"] is True
    assert mem_res["closest_week"] is not None
    assert mem_res["closest_week"]["week"] in [1, 3]
    assert len(mem_res["similar_metrics"]) >= 2
    assert "resembles" in mem_res["summary"]
