"""
Behavior Patterns Engine for Drift.
Evaluates 4 rule-based patterns from personal baseline z-scores:
1. Academic workload-related pattern
2. Digital lifestyle pattern
3. Reduced social interaction pattern
4. Relatively balanced behaviour

Pure Python function: input dict -> output dict with evidence receipts.
Notice: Behavioral indicators only. Not a medical diagnostic tool.
"""

from typing import Dict, List, Any


PATTERN_LABELS = {
    "academic": "Academic workload-related pattern",
    "digital": "Digital lifestyle pattern",
    "social": "Reduced social interaction pattern",
    "balanced": "Relatively balanced behaviour"
}


def detect_patterns(
    baselines: Dict[str, Dict[str, Any]],
    freshness_days: Dict[str, int] = None
) -> Dict[str, Any]:
    """
    Evaluates rule-based behavioral patterns based on personal deviation scores (z).
    
    Args:
        baselines: Dict mapping metric names to baseline dict containing 'z', 'confidence', 'recent_value', 'median'
        freshness_days: Optional dict mapping metric names to days since last observation
        
    Returns:
        {
            "primary_pattern": Dict or None,
            "all_matched_patterns": List[Dict],
            "evaluated_patterns": List[Dict]
        }
    """
    if freshness_days is None:
        freshness_days = {}

    def is_fresh(metric: str) -> bool:
        # A metric older than 7 days is excluded from pattern evaluation
        return freshness_days.get(metric, 0) <= 7 and metric in baselines and baselines[metric]["median"] is not None

    def get_z(metric: str) -> float:
        if is_fresh(metric):
            return baselines[metric].get("z", 0.0)
        return 0.0

    z_study = get_z("study")
    z_sleep = get_z("sleep")
    z_stress = get_z("stress")
    z_screen = get_z("screen")
    z_exercise = get_z("exercise")
    z_social = get_z("social")
    z_mood = get_z("mood")

    patterns = []

    # 1. Academic workload pattern: study z >= +1 AND sleep z <= -1 AND stress z >= +1
    academic_metrics = ["study", "sleep", "stress"]
    fresh_academic = [m for m in academic_metrics if is_fresh(m)]
    if len(fresh_academic) >= 2:
        study_match = z_study >= 0.95
        sleep_match = z_sleep <= -0.95
        stress_match = z_stress >= 0.95

        matched_conditions = sum([study_match, sleep_match, stress_match])
        matched = matched_conditions >= 2 and (study_match or stress_match)

        evidence = []
        if is_fresh("study"):
            evidence.append(f"Study hours are above your usual (z = +{z_study:.1f})")
        if is_fresh("sleep"):
            evidence.append(f"Sleep is lower than your normal band (z = {z_sleep:.1f})")
        if is_fresh("stress"):
            evidence.append(f"Stress is elevated above your baseline (z = +{z_stress:.1f})")

        strength = abs(z_study) + abs(z_sleep) + abs(z_stress)
        patterns.append({
            "key": "academic",
            "name": PATTERN_LABELS["academic"],
            "matched": matched,
            "evidence": evidence,
            "strength": round(strength, 2),
            "description": "Noticeable combination of extended study hours, reduced rest, and elevated pressure."
        })
    else:
        patterns.append({
            "key": "academic",
            "name": PATTERN_LABELS["academic"],
            "matched": False,
            "evidence": ["Insufficient recent measurements to evaluate academic pattern (need at least 2 metrics)"],
            "strength": 0.0,
            "description": "Not enough recent data."
        })

    # 2. Digital lifestyle pattern: screen z >= +1 AND sleep z <= -1 AND exercise z <= -1
    digital_metrics = ["screen", "sleep", "exercise"]
    fresh_digital = [m for m in digital_metrics if is_fresh(m)]
    if len(fresh_digital) >= 2:
        screen_match = z_screen >= 0.95
        sleep_match = z_sleep <= -0.95
        exercise_match = z_exercise <= -0.95

        matched = sum([screen_match, sleep_match, exercise_match]) >= 2 and screen_match

        evidence = []
        if is_fresh("screen"):
            evidence.append(f"Screen time is higher than your usual (z = +{z_screen:.1f})")
        if is_fresh("sleep"):
            evidence.append(f"Sleep is lower than your normal band (z = {z_sleep:.1f})")
        if is_fresh("exercise"):
            evidence.append(f"Physical activity is lower than normal (z = {z_exercise:.1f})")

        strength = abs(z_screen) + abs(z_sleep) + abs(z_exercise)
        patterns.append({
            "key": "digital",
            "name": PATTERN_LABELS["digital"],
            "matched": matched,
            "evidence": evidence,
            "strength": round(strength, 2),
            "description": "Pattern of increased screen use alongside lighter exercise and reduced rest."
        })
    else:
        patterns.append({
            "key": "digital",
            "name": PATTERN_LABELS["digital"],
            "matched": False,
            "evidence": ["Insufficient recent measurements to evaluate digital pattern"],
            "strength": 0.0,
            "description": "Not enough recent data."
        })

    # 3. Reduced social interaction pattern: social z <= -1 AND mood z <= -1 AND stress z >= +1
    social_metrics = ["social", "mood", "stress"]
    fresh_social = [m for m in social_metrics if is_fresh(m)]
    if len(fresh_social) >= 2:
        soc_match = z_social <= -0.95
        mood_match = z_mood <= -0.95
        stress_match = z_stress >= 0.95

        matched = sum([soc_match, mood_match, stress_match]) >= 2 and (soc_match or mood_match)

        evidence = []
        if is_fresh("social"):
            evidence.append(f"Social engagement is below your normal (z = {z_social:.1f})")
        if is_fresh("mood"):
            evidence.append(f"Reported mood is lower than your baseline (z = {z_mood:.1f})")
        if is_fresh("stress"):
            evidence.append(f"Stress is above your usual (z = +{z_stress:.1f})")

        strength = abs(z_social) + abs(z_mood) + abs(z_stress)
        patterns.append({
            "key": "social",
            "name": PATTERN_LABELS["social"],
            "matched": matched,
            "evidence": evidence,
            "strength": round(strength, 2),
            "description": "Pattern of reduced social time accompanied by lower mood and higher stress."
        })
    else:
        patterns.append({
            "key": "social",
            "name": PATTERN_LABELS["social"],
            "matched": False,
            "evidence": ["Insufficient recent measurements to evaluate social pattern"],
            "strength": 0.0,
            "description": "Not enough recent data."
        })

    # 4. Balanced pattern: all |z| < 1.0 for metrics measured recently
    measured_fresh = [m for m in baselines.keys() if is_fresh(m)]
    if measured_fresh:
        all_balanced = all(abs(get_z(m)) < 1.0 for m in measured_fresh)
        balanced_evidence = [f"{m.capitalize()} is within personal normal band (|z| < 1.0)" for m in measured_fresh]
        patterns.append({
            "key": "balanced",
            "name": PATTERN_LABELS["balanced"],
            "matched": all_balanced and not any(p["matched"] for p in patterns[:3]),
            "evidence": balanced_evidence,
            "strength": 1.0 if all_balanced else 0.0,
            "description": "Your daily habits and wellness indicators are tracking closely within your personal normal band."
        })
    else:
        patterns.append({
            "key": "balanced",
            "name": PATTERN_LABELS["balanced"],
            "matched": False,
            "evidence": ["No fresh metrics available to assess balance"],
            "strength": 0.0,
            "description": "Not enough recent data."
        })

    # Rank matched patterns by strength (sum of |z|)
    matched_patterns = [p for p in patterns if p["matched"]]
    matched_patterns.sort(key=lambda x: x["strength"], reverse=True)

    primary = matched_patterns[0] if matched_patterns else None

    return {
        "primary_pattern": primary,
        "all_matched_patterns": matched_patterns,
        "evaluated_patterns": patterns
    }
