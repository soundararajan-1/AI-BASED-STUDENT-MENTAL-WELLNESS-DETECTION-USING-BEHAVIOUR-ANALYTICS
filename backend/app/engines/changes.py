"""
What Changed? Engine for Drift.
Compares the last 7 days mean with the previous 14 days mean for each metric.
Identifies meaningful shifts (|delta| > 1.0 * spread) and generates evidence summaries.

Rule-based, pure Python function: input dict -> output dict.
"""

from typing import Dict, List, Any
import numpy as np


def compute_changes(
    history_by_metric: Dict[str, List[Dict[str, Any]]],
    baselines: Dict[str, Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Computes What Changed deltas for all tracked metrics.
    
    Args:
        history_by_metric: dict mapping metric_name to list of {'days_ago': int, 'value': float}
        baselines: dict mapping metric_name to baseline output from baseline.py
        
    Returns:
        {
            "changes": [
                {
                    "metric": str,
                    "recent_mean": float,
                    "prev_mean": float,
                    "delta": float,
                    "arrow": str,
                    "is_meaningful": bool,
                    "normalized_change": float,
                    "summary": str
                }, ...
            ],
            "meaningful_count": int,
            "headline": str
        }
    """
    changes_list = []

    for metric, obs_list in history_by_metric.items():
        recent_values = [obs["value"] for obs in obs_list if obs["days_ago"] < 7]
        prev_values = [obs["value"] for obs in obs_list if 7 <= obs["days_ago"] < 21]

        if not recent_values or not prev_values:
            # Need observations in both periods to compare
            continue

        recent_mean = float(np.mean(recent_values))
        prev_mean = float(np.mean(prev_values))
        delta = round(recent_mean - prev_mean, 2)

        # Baseline spread
        metric_baseline = baselines.get(metric, {})
        spread = metric_baseline.get("spread", 0.5)

        # Meaningful shift check: |delta| > 1.0 * spread
        is_meaningful = abs(delta) > spread
        normalized_change = round(abs(delta) / max(0.1, spread), 2)

        # Direction arrow
        if delta > 0.05:
            arrow = "↑"
            direction_word = "higher"
        elif delta < -0.05:
            arrow = "↓"
            direction_word = "lower"
        else:
            arrow = "→"
            direction_word = "steady"

        # Unit suffix
        unit = "h" if metric in ["sleep", "study", "screen"] else ("min" if metric == "exercise" else "/5")

        summary = f"{metric.capitalize()} is {abs(delta):.1f}{unit} {direction_word} compared to your prior 2 weeks"

        changes_list.append({
            "metric": metric,
            "recent_mean": round(recent_mean, 2),
            "prev_mean": round(prev_mean, 2),
            "delta": delta,
            "arrow": arrow,
            "is_meaningful": is_meaningful,
            "normalized_change": normalized_change,
            "summary": summary
        })

    # Sort descending by normalized size of change
    changes_list.sort(key=lambda x: x["normalized_change"], reverse=True)

    meaningful = [c for c in changes_list if c["is_meaningful"]]

    if meaningful:
        top = meaningful[0]
        headline = f"Noticeable shift: {top['summary']} ({top['arrow']}{abs(top['delta'])})"
    elif changes_list:
        headline = "Your routine has remained relatively steady over the last week."
    else:
        headline = "Insufficient data to compute recent shifts."

    return {
        "changes": changes_list,
        "meaningful_count": len(meaningful),
        "headline": headline
    }
