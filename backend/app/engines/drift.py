"""
Quiet Drift Engine (CUSUM) for Drift.
Detects subtle, persistent behavioral drift that threshold alerts miss.
Uses a frozen reference (e.g. first 14 valid days) to avoid absorbing gradual decline into baseline.

Direction signs:
- sleep, mood, exercise, social: bad = down (sign = -1, so decrease increases z_t)
- stress, screen: bad = up (sign = +1, so increase increases z_t)
- study: ignored unless paired with sleep

CUSUM recurrence:
  z_t = sign * (x_t - mu_ref) / sigma_ref
  S_t = max(0, S_{t-1} + z_t - k) with k = 0.5
Flag when S_t > h with h = 4.0.
"""

from typing import Dict, List, Any, Optional
import numpy as np

# Direction sign mapping:
# +1 means higher value is bad (stress, screen)
# -1 means lower value is bad (sleep, mood, exercise, social)
DIRECTION_SIGNS = {
    "sleep": -1,
    "mood": -1,
    "exercise": -1,
    "social": -1,
    "stress": 1,
    "screen": 1,
    "study": 1
}

METRIC_FLOORS = {
    "sleep": 0.5,
    "stress": 0.5,
    "mood": 0.5,
    "study": 0.5,
    "screen": 0.5,
    "exercise": 5.0,
    "social": 0.5
}


def compute_cusum_for_metric(
    time_series: List[Dict[str, Any]],
    metric: str,
    k: float = 0.5,
    h: float = 4.0,
    reference_days: int = 14
) -> Dict[str, Any]:
    """
    Computes the CUSUM drift series for a single metric over time.
    
    time_series: sorted list of dicts [{'date': str, 'value': float}] in chronological order.
    k: slack value (default 0.5)
    h: threshold to trigger drift flag (default 4.0)
    reference_days: number of initial days used to freeze mu_ref and sigma_ref
    """
    if len(time_series) < reference_days + 1:
        return {
            "metric": metric,
            "has_drift": False,
            "flag_date": None,
            "days_drifting": 0,
            "current_cusum": 0.0,
            "series": [],
            "message": "Insufficient data to detect quiet drift (learning baseline)."
        }

    # Frozen reference from first reference_days
    ref_values = [p["value"] for p in time_series[:reference_days]]
    mu_ref = float(np.mean(ref_values))
    sigma_ref = max(METRIC_FLOORS.get(metric, 0.5), float(np.std(ref_values)))

    sign = DIRECTION_SIGNS.get(metric, 1)

    s_t = 0.0
    series = []
    flag_date = None
    drift_start_idx = None
    has_drift = False

    for idx, point in enumerate(time_series):
        date_str = point["date"]
        val = point["value"]

        # Standardized shift in adverse direction
        z_t = sign * (val - mu_ref) / sigma_ref
        s_t = max(0.0, s_t + z_t - k)

        series.append({
            "date": date_str,
            "value": round(val, 2),
            "z": round(z_t, 2),
            "cusum": round(s_t, 2),
            "threshold": h,
            "flagged": s_t > h
        })

        if s_t > h and not has_drift:
            has_drift = True
            flag_date = date_str
            # Backtrack to when s_t first started rising continuously above 0
            back = idx
            while back > 0 and series[back]["cusum"] > 0:
                back -= 1
            drift_start_idx = back

    days_drifting = (len(time_series) - 1 - drift_start_idx) if drift_start_idx is not None else 0

    direction_str = "down" if sign == -1 else "up"
    if has_drift:
        message = f"Your {metric} has been quietly drifting {direction_str} for about {max(1, days_drifting)} days."
    else:
        message = f"Your {metric} shows no quiet drift away from your initial normal."

    return {
        "metric": metric,
        "has_drift": has_drift,
        "flag_date": flag_date,
        "days_drifting": days_drifting,
        "current_cusum": round(s_t, 2),
        "mu_ref": round(mu_ref, 2),
        "sigma_ref": round(sigma_ref, 2),
        "threshold": h,
        "series": series,
        "message": message
    }


def compute_all_drifts(
    metric_series_dict: Dict[str, List[Dict[str, Any]]],
    k: float = 0.5,
    h: float = 4.0
) -> Dict[str, Any]:
    """
    Computes CUSUM drift detection across all tracked metrics.
    Returns summary and detailed series for charting.
    """
    results = {}
    active_drifts = []

    for metric, series in metric_series_dict.items():
        if metric == "study":
            # Per section 6.4: study is ignored unless combined with sleep
            continue
        res = compute_cusum_for_metric(series, metric, k=k, h=h)
        results[metric] = res
        if res["has_drift"]:
            active_drifts.append(res)

    has_any_drift = len(active_drifts) > 0
    top_drift = active_drifts[0] if has_any_drift else None

    return {
        "has_drift": has_any_drift,
        "primary_drift": top_drift,
        "all_drifts": results,
        "summary": top_drift["message"] if top_drift else "No significant quiet drift detected."
    }
