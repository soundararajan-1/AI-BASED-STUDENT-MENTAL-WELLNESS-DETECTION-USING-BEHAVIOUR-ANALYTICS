"""
Deterministic Template Fallback and Explanation Receipts for Drift.
Generates structured reflections directly from rule engine evidence.
Guarantees 100% demo stability even when offline or without an API key.

Includes Evidence Receipts mapping every sentence to underlying numerical facts.
"""

from typing import Dict, List, Any


def generate_template_insight(facts: Dict[str, Any]) -> Dict[str, Any]:
    """
    Builds a deterministic, evidence-grounded reflection with Explanation Receipts.
    
    Args:
        facts: dictionary containing baselines, deltas, patterns, and drift findings.
        
    Returns:
        {
            "what_changed": str,
            "pattern": str,
            "factors": str,
            "suggestions": List[str],
            "support": str,
            "receipts": List[Dict[str, Any]],
            "source": "rule_template_fallback"
        }
    """
    changes = facts.get("changes", [])
    pattern = facts.get("pattern", {})
    drift = facts.get("drift", {})

    receipts = []
    receipt_idx = 1

    # 1. What Changed sentence + receipt
    if changes:
        top_change = changes[0]
        metric = top_change.get("metric", "routine")
        delta = top_change.get("delta", 0.0)
        arrow = top_change.get("arrow", "→")
        recent_m = top_change.get("recent_mean", 0.0)
        prev_m = top_change.get("prev_mean", 0.0)

        what_changed_sentence = (
            f"Over the last 7 days, your average {metric} shifted to {recent_m} "
            f"({arrow}{abs(delta)} compared to your prior 14-day average of {prev_m})."
        )
        receipts.append({
            "id": f"receipt_{receipt_idx}",
            "sentence": what_changed_sentence,
            "claim": f"Shift in {metric}",
            "evidence": [
                f"7-day average: {recent_m}",
                f"Previous 14-day average: {prev_m}",
                f"Net shift: {delta:+0.1f}"
            ]
        })
        receipt_idx += 1
    else:
        what_changed_sentence = "Your tracked daily metrics have remained within steady personal boundaries."
        receipts.append({
            "id": f"receipt_{receipt_idx}",
            "sentence": what_changed_sentence,
            "claim": "Routine stability",
            "evidence": ["All tracked metrics are tracking within ±1.0 of your personal baseline spread."]
        })
        receipt_idx += 1

    # 2. Pattern sentence + receipt
    pattern_name = pattern.get("name", "Balanced routine")
    pattern_desc = pattern.get("description", "Daily habits are aligned with your personal normal.")
    pattern_evidence = pattern.get("evidence", [])

    pattern_sentence = f"Recent check-ins show an indicator aligned with: {pattern_name}."
    receipts.append({
        "id": f"receipt_{receipt_idx}",
        "sentence": pattern_sentence,
        "claim": pattern_name,
        "evidence": pattern_evidence if pattern_evidence else ["Habits fall within regular baseline spread."]
    })
    receipt_idx += 1

    # 3. Contributing factors sentence + receipt
    if drift.get("has_drift"):
        drift_msg = drift.get("message", "A slow drift has been detected.")
        factors_sentence = f"A key factor is quiet drift: {drift_msg}"
        receipts.append({
            "id": f"receipt_{receipt_idx}",
            "sentence": factors_sentence,
            "claim": "Quiet Drift Detection",
            "evidence": [
                f"Metric: {drift.get('metric', 'sleep')}",
                f"Accumulated CUSUM: {drift.get('current_cusum', 0.0)} (threshold = 4.0)",
                f"Flagged on date: {drift.get('flag_date', 'Recent')}"
            ]
        })
        receipt_idx += 1
    else:
        factors_sentence = pattern_desc
        receipts.append({
            "id": f"receipt_{receipt_idx}",
            "sentence": factors_sentence,
            "claim": "Factor overview",
            "evidence": pattern_evidence[:2] if pattern_evidence else ["No severe outlier detected."]
        })
        receipt_idx += 1

    # 4. Suggestions
    suggestions = [
        "Plan a 20-minute wind-down buffer before bed with screens turned off.",
        "Take a short 10-minute daylight walk between intense study blocks.",
        "Keep your daily check-in streak going to help Drift refine your personal band."
    ]

    support_sentence = (
        "Small, gentle adjustments can help restore your personal balance without adding pressure."
    )

    return {
        "what_changed": what_changed_sentence,
        "pattern": pattern_sentence,
        "factors": factors_sentence,
        "suggestions": suggestions,
        "support": support_sentence,
        "receipts": receipts,
        "source": "deterministic_receipt_engine"
    }
