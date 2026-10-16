"""
Personal Levers Engine for Drift.
Identifies personal correlations between lifestyle behaviors and next-day wellness indicators.
Specifically tests: Next-day stress on days following above-median sleep vs below-median sleep.

Phrased supportively as 'tended to be', never claims causality.
"""

from typing import Dict, List, Any
import numpy as np


def compute_personal_levers(
    daily_records: List[Dict[str, Any]],
    sleep_median: float
) -> Dict[str, Any]:
    """
    Evaluates personal levers by comparing next-day stress between days after
    adequate sleep (>= median) vs reduced sleep (< median).
    
    Args:
        daily_records: list of dicts [{'date': str, 'sleep': float, 'stress': float}],
                       chronologically ordered.
        sleep_median: student's personal sleep median.
        
    Returns:
        {
            "has_lever": bool,
            "diff": float,
            "higher_sleep_stress_avg": float,
            "lower_sleep_stress_avg": float,
            "sample_size": int,
            "statement": str,
            "disclaimer": str
        }
    """
    disclaimer = "This is a pattern observed in your own historical data, not proof of cause."

    if len(daily_records) < 10:
        return {
            "has_lever": False,
            "diff": 0.0,
            "higher_sleep_stress_avg": None,
            "lower_sleep_stress_avg": None,
            "sample_size": len(daily_records),
            "statement": "Still gathering enough check-ins to find personal routine patterns.",
            "disclaimer": disclaimer
        }

    # Group next-day stress
    after_high_sleep = []
    after_low_sleep = []

    for i in range(len(daily_records) - 1):
        today = daily_records[i]
        tomorrow = daily_records[i + 1]

        sleep_val = today.get("sleep")
        next_stress = tomorrow.get("stress")

        if sleep_val is not None and next_stress is not None:
            if sleep_val >= sleep_median:
                after_high_sleep.append(next_stress)
            else:
                after_low_sleep.append(next_stress)

    if len(after_high_sleep) < 4 or len(after_low_sleep) < 4:
        return {
            "has_lever": False,
            "diff": 0.0,
            "higher_sleep_stress_avg": None,
            "lower_sleep_stress_avg": None,
            "sample_size": len(daily_records),
            "statement": "Need more balanced variation in your sleep to detect a reliable pattern.",
            "disclaimer": disclaimer
        }

    mean_high = float(np.mean(after_high_sleep))
    mean_low = float(np.mean(after_low_sleep))
    diff = round(mean_low - mean_high, 2)

    has_lever = abs(diff) >= 0.3

    if diff > 0.2:
        statement = (
            f"On days after you slept more than your usual ({sleep_median:.1f}h), "
            f"your next-day stress tended to be about {diff:.1f} points lower."
        )
    elif diff < -0.2:
        statement = (
            f"On days after lighter sleep, your reported stress tended to be {abs(diff):.1f} points lower "
            f"(potentially reflecting lower academic workload on those days)."
        )
    else:
        statement = "Your daily stress levels showed little sensitivity to sleep fluctuations."

    return {
        "has_lever": has_lever,
        "diff": diff,
        "higher_sleep_stress_avg": round(mean_high, 2),
        "lower_sleep_stress_avg": round(mean_low, 2),
        "sample_size": len(daily_records),
        "statement": statement,
        "disclaimer": disclaimer
    }
