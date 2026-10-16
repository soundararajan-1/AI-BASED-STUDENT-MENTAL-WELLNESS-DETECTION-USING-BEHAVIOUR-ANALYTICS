"""
Personal Normal Band Engine for Drift.
Computes personalized medians, spreads (weighted MAD), normal bands (median ± 1.5 * spread),
deviation z-scores, and baseline confidence scores.

Rule-based, pure Python function: input dict / records -> output dict.
"""

from typing import Dict, List, Any, Optional
import numpy as np


METRIC_FLOORS = {
    "sleep": 0.5,      # hours
    "stress": 0.5,     # scale 1-5
    "mood": 0.5,       # scale 1-5
    "study": 0.5,      # hours
    "screen": 0.5,     # hours
    "exercise": 5.0,   # minutes
    "social": 0.5      # scale 1-5
}


def weighted_median(values: np.ndarray, weights: np.ndarray) -> float:
    """
    Computes the weighted median of a 1D array of values with corresponding positive weights.
    """
    if len(values) == 0:
        return 0.0
    sorted_indices = np.argsort(values)
    sorted_values = values[sorted_indices]
    sorted_weights = weights[sorted_indices]

    cumulative_weight = np.cumsum(sorted_weights)
    cutoff = cumulative_weight[-1] / 2.0

    idx = np.searchsorted(cumulative_weight, cutoff)
    return float(sorted_values[min(idx, len(sorted_values) - 1)])


def compute_baseline_for_metric(
    observations: List[Dict[str, Any]],
    metric_name: str,
    recent_days_for_z: int = 3,
    reference_observations: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Computes the personal baseline normal band for a single metric.
    
    observations: list of dicts [{'days_ago': int, 'value': float}]
    reference_observations: optional frozen baseline observations (e.g., first 14 days)
                            to prevent slow drift from being absorbed into the baseline.
    """
    floor = METRIC_FLOORS.get(metric_name, 0.5)
    n_obs = len(observations)

    if n_obs == 0 and not reference_observations:
        return {
            "metric": metric_name,
            "median": None,
            "spread": floor,
            "band_low": None,
            "band_high": None,
            "recent_value": None,
            "z": 0.0,
            "confidence": 0.0,
            "n_observations": 0,
            "status": "No data available",
            "suppress_alerts": True
        }

    # Decide baseline reference set
    if reference_observations and len(reference_observations) > 0:
        base_set = reference_observations
    else:
        # If student has established history (> 14 days ago), use the reference window
        # (days_ago >= 7) to avoid absorbing the immediate acute shift into baseline
        older_obs = [obs for obs in observations if obs["days_ago"] >= 7]
        if len(older_obs) >= 7:
            base_set = older_obs
        else:
            base_set = observations

    # Extract values and compute weights for baseline
    base_values = np.array([obs["value"] for obs in base_set], dtype=float)
    base_days_ago = np.array([obs["days_ago"] for obs in base_set], dtype=float)
    # Exponential weights: weight = 0.85^(days_ago_relative)
    min_day = np.min(base_days_ago) if len(base_days_ago) > 0 else 0
    rel_days = np.maximum(0, base_days_ago - min_day)
    weights = np.power(0.90, rel_days)

    # 1. Weighted median
    med = weighted_median(base_values, weights)

    # 2. Weighted MAD (Median Absolute Deviation) * 1.4826
    abs_deviations = np.abs(base_values - med)
    raw_mad = weighted_median(abs_deviations, weights)
    spread = max(floor, float(raw_mad * 1.4826))

    # 3. Normal band: median ± 1.5 * spread
    band_low = round(med - 1.5 * spread, 2)
    band_high = round(med + 1.5 * spread, 2)

    # 4. Recent value or 3-day mean for z-score calculation
    recent_obs = [obs["value"] for obs in observations if obs["days_ago"] < recent_days_for_z]
    if recent_obs:
        recent_mean = float(np.mean(recent_obs))
    else:
        sorted_by_recency = sorted(observations, key=lambda x: x["days_ago"])
        recent_mean = float(sorted_by_recency[0]["value"]) if sorted_by_recency else med

    # 5. Deviation score z
    z = round((recent_mean - med) / spread, 2)

    # 6. Baseline confidence: min(1.0, n_observations / 14)
    confidence = round(min(1.0, n_obs / 14.0), 2)

    # In first 7 days, suppress alerts and show gentle message
    suppress_alerts = n_obs < 7
    if suppress_alerts:
        status = f"Still learning your normal (confidence {int(confidence * 100)}%)"
    else:
        status = f"Personal normal established (confidence {int(confidence * 100)}%)"

    return {
        "metric": metric_name,
        "median": round(med, 2),
        "spread": round(spread, 2),
        "band_low": band_low,
        "band_high": band_high,
        "recent_value": round(recent_mean, 2),
        "z": z,
        "confidence": confidence,
        "n_observations": n_obs,
        "status": status,
        "suppress_alerts": suppress_alerts
    }


def compute_all_baselines(
    history_by_metric: Dict[str, List[Dict[str, Any]]],
    reference_history: Optional[Dict[str, List[Dict[str, Any]]]] = None
) -> Dict[str, Dict[str, Any]]:
    """
    Computes personal baseline normal bands for all metrics provided.
    """
    result = {}
    for metric_name, obs_list in history_by_metric.items():
        ref_obs = reference_history.get(metric_name) if reference_history else None
        result[metric_name] = compute_baseline_for_metric(obs_list, metric_name, reference_observations=ref_obs)
    return result
