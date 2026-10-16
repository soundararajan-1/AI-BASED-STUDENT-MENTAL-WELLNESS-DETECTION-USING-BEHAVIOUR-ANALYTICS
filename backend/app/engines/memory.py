"""
Pattern Memory Engine for Drift.
Compares the current week's 7-metric fingerprint vector with all past completed weeks
using normalized Euclidean distance.

Finds historical resemblance: 'This week resembles your Week 3 (close in sleep and stress)'.
Requires at least 3 completed past weeks.
"""

from typing import Dict, List, Any, Optional
import numpy as np

ALL_7_METRICS = ["mood", "stress", "sleep", "study", "screen", "exercise", "social"]


def compute_pattern_memory(
    weekly_history: List[Dict[str, Any]],
    baselines: Dict[str, Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Finds the closest past completed week to the current latest week.
    
    Args:
        weekly_history: list of dicts [{'week': int, 'label': str, 'sleep': float, ...}]
        baselines: dict mapping metric -> baseline details (spread, median)
        
    Returns:
        {
            "has_memory": bool,
            "closest_week": Optional[Dict],
            "distance": float,
            "similar_metrics": List[str],
            "summary": str
        }
    """
    # Needs at least 4 total weeks (current week + at least 3 past weeks)
    if len(weekly_history) < 4:
        return {
            "has_memory": False,
            "closest_week": None,
            "distance": 999.0,
            "similar_metrics": [],
            "summary": "Building weekly memory (needs at least 3 completed past weeks)."
        }

    current_week = weekly_history[-1]
    past_weeks = weekly_history[:-1]

    # Convert a week dict into a z-scored vector
    def get_week_vector(w: Dict[str, Any]) -> np.ndarray:
        vec = []
        for m in ALL_7_METRICS:
            val = w.get(m)
            b = baselines.get(m, {})
            med = b.get("median", 0.0) or 0.0
            spread = b.get("spread", 0.5) or 0.5
            if val is not None:
                z = (val - med) / max(0.1, spread)
            else:
                z = 0.0
            vec.append(z)
        return np.array(vec, dtype=float)

    curr_vec = get_week_vector(current_week)

    best_match = None
    min_dist = float("inf")
    best_similar_metrics = []

    for past_w in past_weeks:
        past_vec = get_week_vector(past_w)
        # Euclidean distance
        dist = float(np.linalg.norm(curr_vec - past_vec))

        # Check metric-by-metric proximity
        metric_diffs = np.abs(curr_vec - past_vec)
        close_metrics = [ALL_7_METRICS[i] for i in range(len(ALL_7_METRICS)) if metric_diffs[i] < 1.0]

        if dist < min_dist:
            min_dist = dist
            best_match = past_w
            best_similar_metrics = close_metrics

    # Distance threshold for a meaningful match
    is_meaningful = min_dist < 4.5 and len(best_similar_metrics) >= 2

    if is_meaningful and best_match:
        sim_str = " and ".join(best_similar_metrics[:2])
        match_label = best_match.get("label") or f"Week {best_match.get('week', '')}"
        summary = f"This week resembles your {match_label} (closely aligned in {sim_str})."
    else:
        summary = "This week's routine has a unique profile compared to earlier weeks."

    return {
        "has_memory": is_meaningful,
        "closest_week": best_match if is_meaningful else None,
        "distance": round(min_dist, 2),
        "similar_metrics": best_similar_metrics,
        "summary": summary
    }
