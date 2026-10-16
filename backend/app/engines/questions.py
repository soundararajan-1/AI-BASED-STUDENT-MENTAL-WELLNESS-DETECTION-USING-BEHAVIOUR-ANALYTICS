"""
Question Budget Engine for Drift.
Selects exactly 1 rotating micro-question per day (taking ~25 seconds total check-in)
by optimizing information gain and minimizing student survey fatigue.

Scoring formula per candidate metric:
  score = staleness_days * importance_weight
        + 3 (if metric has recent deviation or drift flag)
        + 2 (if tied to today's main factor)
        - 5 (if asked in the last 2 days)

Importance weights:
  sleep: 1.5, study: 1.2, others: 1.0.

Escalation:
  When stress >= 4 AND mood <= 2, offers up to 2 optional follow-up micro-questions.
"""

from typing import Dict, List, Any, Optional

CANDIDATE_QUESTIONS = {
    "sleep": {
        "key": "sleep",
        "title": "Sleep Duration",
        "prompt": "About how many hours of sleep did you get last night?",
        "type": "buckets",
        "options": [
            {"label": "< 5 hrs", "value": 4.5},
            {"label": "5 - 6 hrs", "value": 5.5},
            {"label": "6 - 7 hrs", "value": 6.5},
            {"label": "7 - 8 hrs", "value": 7.5},
            {"label": "8+ hrs", "value": 8.5}
        ],
        "unit": "hours",
        "importance": 1.5
    },
    "study": {
        "key": "study",
        "title": "Academic Study Time",
        "prompt": "About how many hours did you spend on focused study or lectures today?",
        "type": "slider",
        "min": 0.0,
        "max": 12.0,
        "step": 0.5,
        "unit": "hours",
        "importance": 1.2
    },
    "screen": {
        "key": "screen",
        "title": "Screen Leisure Time",
        "prompt": "Estimated hours of recreational screen time (social apps, videos, gaming)?",
        "type": "slider",
        "min": 0.0,
        "max": 12.0,
        "step": 0.5,
        "unit": "hours",
        "importance": 1.0
    },
    "exercise": {
        "key": "exercise",
        "title": "Physical Activity",
        "prompt": "How many minutes of brisk walking, sports, or movement did you get today?",
        "type": "buckets",
        "options": [
            {"label": "Under 15 min", "value": 10.0},
            {"label": "15 - 30 min", "value": 22.0},
            {"label": "30 - 45 min", "value": 37.0},
            {"label": "45 - 60 min", "value": 52.0},
            {"label": "60+ min", "value": 75.0}
        ],
        "unit": "minutes",
        "importance": 1.0
    },
    "social": {
        "key": "social",
        "title": "Social Connection",
        "prompt": "How supported or connected did you feel with peers, friends, or family today?",
        "type": "scale",
        "options": [
            {"label": "Very distant (1)", "value": 1.0},
            {"label": "Somewhat low (2)", "value": 2.0},
            {"label": "Moderate (3)", "value": 3.0},
            {"label": "Connected (4)", "value": 4.0},
            {"label": "Very connected (5)", "value": 5.0}
        ],
        "unit": "scale",
        "importance": 1.0
    }
}

FACTOR_METRIC_MAP = {
    "studies": "study",
    "study": "study",
    "sleep": "sleep",
    "screen": "screen",
    "social": "social",
    "personal": "sleep",
    "routine": "exercise"
}


def select_daily_micro_question(
    last_asked_days_ago: Dict[str, int],
    flagged_metrics: Optional[List[str]] = None,
    today_main_factor: Optional[str] = None,
    today_stress: Optional[int] = None,
    today_mood: Optional[int] = None
) -> Dict[str, Any]:
    """
    Evaluates all candidate micro questions and picks the highest scoring question.
    
    Args:
        last_asked_days_ago: dict mapping metric keys to integer days since last measured.
        flagged_metrics: list of metric keys with active deviation (|z| > 1) or drift flag.
        today_main_factor: string main factor selected by the student (e.g. 'Studies').
        today_stress: today's stress rating (1-5).
        today_mood: today's mood rating (1-5).
        
    Returns:
        {
            "selected_question": Dict,
            "reason_asked": str,
            "all_scores": Dict[str, float],
            "offer_escalation": bool,
            "escalation_questions": List[Dict]
        }
    """
    if flagged_metrics is None:
        flagged_metrics = []

    factor_key = today_main_factor.strip().lower() if today_main_factor else ""
    tied_metric = FACTOR_METRIC_MAP.get(factor_key, "")

    scores = {}
    reasons = {}

    for key, q_meta in CANDIDATE_QUESTIONS.items():
        staleness = last_asked_days_ago.get(key, 7)  # default 7 days if never asked
        importance = q_meta["importance"]

        # Base score
        score = staleness * importance

        # Deviation or drift bonus (+3)
        if key in flagged_metrics:
            score += 3.0

        # Tied to today's main factor bonus (+2)
        if key == tied_metric:
            score += 2.0

        # Recently asked penalty (-5 if asked within last 2 days)
        if staleness <= 1:
            score -= 5.0
        elif staleness == 2:
            score -= 2.0

        scores[key] = round(score, 2)

        # Formulate human-friendly reason
        if key in flagged_metrics:
            reasons[key] = f"Your {key} showed a recent shift, so we're keeping an eye on it"
        elif key == tied_metric:
            reasons[key] = f"You noted '{today_main_factor}' as today's main factor"
        elif staleness >= 4:
            reasons[key] = f"Haven't checked your {key} for {staleness} days"
        else:
            reasons[key] = f"Scheduled rotation check for {key}"

    # Pick candidate with highest score
    sorted_candidates = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    best_key = sorted_candidates[0][0]

    selected_q = CANDIDATE_QUESTIONS[best_key].copy()
    reason_asked = reasons[best_key]

    # Escalation check: when stress >= 4 AND mood <= 2, offer optional follow-up
    offer_escalation = False
    escalation_qs = []
    if today_stress is not None and today_mood is not None:
        if today_stress >= 4 and today_mood <= 2:
            offer_escalation = True
            # Choose top 2 remaining questions
            other_keys = [k for k, _ in sorted_candidates if k != best_key][:2]
            escalation_qs = [CANDIDATE_QUESTIONS[k].copy() for k in other_keys]

    return {
        "selected_question": selected_q,
        "reason_asked": reason_asked,
        "all_scores": scores,
        "offer_escalation": offer_escalation,
        "escalation_questions": escalation_qs
    }
