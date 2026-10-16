"""
Secondary Comparison: Random Forest Classifier for Prototype Concern Level.
Trained on synthetic persona check-in data with 10% label noise.

Notice: Trained on synthetic data. Prototype-level concern score only.
Not clinically validated. This is a secondary benchmark to the primary rule engines.
"""

from typing import Dict, Any, Tuple, Optional
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix

FEATURE_NAMES = [
    "mood", "stress", "sleep", "study", "screen", "exercise", "social", "academic_pressure"
]

TARGET_LABELS = ["Low Concern", "Moderate Concern", "Higher Concern"]


def compute_ground_truth_concern(row: pd.Series) -> int:
    """
    Documented rule for ground-truth synthetic wellness concern label:
    - 0: Low Concern (balanced habits)
    - 1: Moderate Concern (mild stress or minor sleep deficit)
    - 2: Higher Concern (high stress >= 4, severe sleep deficit < 5.5, high study >= 6.5)
    """
    stress = row["stress"]
    sleep = row["sleep"]
    study = row["study"]
    mood = row["mood"]

    score = 0
    if stress >= 4:
        score += 2
    elif stress == 3:
        score += 1

    if sleep <= 5.2:
        score += 2
    elif sleep <= 6.2:
        score += 1

    if study >= 6.5:
        score += 1

    if mood <= 2:
        score += 1

    if score >= 4:
        return 2  # Higher Concern
    elif score >= 2:
        return 1  # Moderate Concern
    return 0     # Low Concern


def train_random_forest_model(
    df: pd.DataFrame,
    noise_ratio: float = 0.10,
    random_state: int = 42
) -> Tuple[RandomForestClassifier, Dict[str, Any]]:
    """
    Trains a Random Forest classifier on synthetic features with 10% label noise.
    
    Returns:
        (trained_model, metrics_dict)
    """
    df = df.copy()

    # Engineer academic_pressure feature: study / max(1.0, sleep)
    if "academic_pressure" not in df.columns:
        df["academic_pressure"] = round(df["study"] / np.maximum(1.0, df["sleep"]), 2)

    # Compute target labels
    df["label"] = df.apply(compute_ground_truth_concern, axis=1)

    # Add 10% label noise
    rng = np.random.RandomState(random_state)
    n_noisy = int(len(df) * noise_ratio)
    noisy_indices = rng.choice(df.index, size=n_noisy, replace=False)
    for idx in noisy_indices:
        df.loc[idx, "label"] = rng.choice([0, 1, 2])

    X = df[FEATURE_NAMES]
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=random_state, stratify=y
    )

    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=6,
        random_state=random_state
    )
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    acc = float(accuracy_score(y_test, y_pred))
    cm = confusion_matrix(y_test, y_pred).tolist()

    # Feature importances
    importances = dict(zip(FEATURE_NAMES, [round(float(v), 3) for v in clf.feature_importances_]))
    sorted_importances = sorted(importances.items(), key=lambda x: x[1], reverse=True)

    metrics = {
        "accuracy": round(acc, 3),
        "confusion_matrix": cm,
        "feature_importances": sorted_importances,
        "classes": TARGET_LABELS,
        "disclaimer": "Trained on synthetic data. Prototype-level concern level only. Not clinically validated."
    }

    return clf, metrics


# Module-level cache for real-time inference
_CACHED_MODEL: Optional[RandomForestClassifier] = None
_CACHED_METRICS: Optional[Dict[str, Any]] = None


def get_or_train_rf_model() -> Tuple[RandomForestClassifier, Dict[str, Any]]:
    """
    Returns the cached Random Forest model or trains one dynamically
    using synthetic persona distributions.
    """
    global _CACHED_MODEL, _CACHED_METRICS
    if _CACHED_MODEL is not None and _CACHED_METRICS is not None:
        return _CACHED_MODEL, _CACHED_METRICS

    # Generate synthetic training dataframe
    rng = np.random.RandomState(42)
    n_samples = 400
    synthetic_rows = []

    for _ in range(n_samples):
        base_mood = rng.choice([1, 2, 3, 4, 5], p=[0.05, 0.15, 0.40, 0.25, 0.15])
        base_stress = rng.choice([1, 2, 3, 4, 5], p=[0.15, 0.35, 0.30, 0.15, 0.05])
        base_sleep = float(np.clip(rng.normal(7.0, 1.2), 3.5, 11.0))
        base_study = float(np.clip(rng.normal(4.0, 1.5), 0.5, 10.0))
        base_screen = float(np.clip(rng.normal(4.5, 1.8), 1.0, 12.0))
        base_exercise = float(np.clip(rng.normal(25.0, 15.0), 0.0, 90.0))
        base_social = float(np.clip(rng.normal(3.2, 0.9), 1.0, 5.0))

        synthetic_rows.append({
            "mood": base_mood,
            "stress": base_stress,
            "sleep": round(base_sleep, 1),
            "study": round(base_study, 1),
            "screen": round(base_screen, 1),
            "exercise": round(base_exercise, 1),
            "social": round(base_social, 1),
        })

    df = pd.DataFrame(synthetic_rows)
    _CACHED_MODEL, _CACHED_METRICS = train_random_forest_model(df, random_state=42)
    return _CACHED_MODEL, _CACHED_METRICS


def predict_student_wellness(
    checkin_features: Dict[str, float],
    baseline_medians: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Real-time Machine Learning prediction and wellness scoring for student check-in.
    Evaluates Random Forest probabilities, feature drivers, and wellness score.
    """
    model, metrics = get_or_train_rf_model()
    baseline_medians = baseline_medians or {}

    # Defaults aligned with typical college baseline
    defaults = {
        "mood": 3.0,
        "stress": 2.0,
        "sleep": 7.0,
        "study": 3.5,
        "screen": 4.5,
        "exercise": 30.0,
        "social": 3.5
    }

    # Merge features: checkin_features take precedence, then baseline_medians, then defaults
    merged = {}
    for key in defaults:
        if key in checkin_features and checkin_features[key] is not None:
            merged[key] = float(checkin_features[key])
        elif key in baseline_medians and baseline_medians[key] is not None:
            merged[key] = float(baseline_medians[key])
        else:
            merged[key] = defaults[key]

    academic_pressure = round(merged["study"] / max(1.0, merged["sleep"]), 2)
    merged["academic_pressure"] = academic_pressure

    # Vector for Random Forest
    feat_vector = [[merged[f] for f in FEATURE_NAMES]]
    prob_dist = model.predict_proba(feat_vector)[0]
    pred_idx = int(np.argmax(prob_dist))
    pred_label = TARGET_LABELS[pred_idx]
    confidence_pct = round(float(prob_dist[pred_idx]) * 100, 1)

    # Calculate 0-100 normalized Wellness Score
    # Low Concern gives high score, Higher Concern reduces score
    prob_low = float(prob_dist[0])
    prob_mod = float(prob_dist[1])
    prob_high = float(prob_dist[2])

    # Continuous score formula
    raw_score = 100.0 - (prob_high * 55.0 + prob_mod * 28.0)
    # Adjust slightly for immediate mood and stress
    raw_score += (merged["mood"] - 3.0) * 3.5
    raw_score -= (merged["stress"] - 2.0) * 4.0
    wellness_score = int(np.clip(round(raw_score), 15, 98))

    # Detect top feature drivers comparing to baselines
    drivers = []
    if "sleep" in baseline_medians and baseline_medians["sleep"]:
        delta_sleep = merged["sleep"] - baseline_medians["sleep"]
        if abs(delta_sleep) >= 0.8:
            dir_str = "lower" if delta_sleep < 0 else "higher"
            drivers.append(f"Sleep is {abs(delta_sleep):.1f}h {dir_str} than personal normal ({baseline_medians['sleep']:.1f}h)")

    if "study" in baseline_medians and baseline_medians["study"]:
        delta_study = merged["study"] - baseline_medians["study"]
        if abs(delta_study) >= 1.0:
            dir_str = "heavier" if delta_study > 0 else "lighter"
            drivers.append(f"Study load is {abs(delta_study):.1f}h {dir_str} than usual")

    if merged["stress"] >= 4:
        drivers.append("Self-reported stress level is elevated (4+/5)")
    elif merged["stress"] <= 1:
        drivers.append("Stress level is minimal (1/5)")

    if merged["mood"] >= 4:
        drivers.append("High positive mood rating reported today")
    elif merged["mood"] <= 2:
        drivers.append("Lower energy or mood rating reported today")

    if not drivers:
        drivers.append("Overall parameters remain within personal normal band")

    return {
        "wellness_score": wellness_score,
        "concern_tier": pred_label,
        "confidence_pct": confidence_pct,
        "probabilities": {
            "low_concern": round(prob_low * 100, 1),
            "moderate_concern": round(prob_mod * 100, 1),
            "higher_concern": round(prob_high * 100, 1)
        },
        "top_drivers": drivers[:3],
        "academic_pressure_index": academic_pressure,
        "features_evaluated": merged,
        "model_architecture": "Random Forest Classifier (100 Estimators)"
    }

