"""
API routes for student wellness dashboard and time-travel simulation.
Powers the 7-axis Fingerprint radar, What Changed cards, Quiet Drift alerts, and timeline charts.
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
import numpy as np
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Student, Checkin, MetricLog
from app.engines.baseline import compute_all_baselines
from app.engines.changes import compute_changes
from app.engines.patterns import detect_patterns
from app.engines.drift import compute_all_drifts
from app.engines.memory import compute_pattern_memory
from app.engines.levers import compute_personal_levers
from app.safety.safety import evaluate_safety
from app.llm.client import generate_wellness_insight

router = APIRouter(tags=["dashboard"])

ALL_7_METRICS = ["mood", "stress", "sleep", "study", "screen", "exercise", "social"]


@router.get("/dashboard/{student_id}")
def get_dashboard_data(
    student_id: str,
    as_of: Optional[str] = Query(None, description="Time-travel date filter (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Retrieves full dashboard data for a student.
    Supports time-travel simulation via `as_of=YYYY-MM-DD`.
    """
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Load all checkin and metric rows
    all_checkins = (
        db.query(Checkin)
        .filter(Checkin.student_id == student_id)
        .order_by(Checkin.date.asc())
        .all()
    )

    if not all_checkins:
        return {
            "student": {
                "student_id": student.student_id,
                "department": student.department,
                "year": student.year,
                "consent": student.consent
            },
            "as_of": as_of or datetime.now().strftime("%Y-%m-%d"),
            "has_data": False,
            "message": "No check-ins recorded yet."
        }

    available_dates = [c.date for c in all_checkins]
    eval_date = as_of if as_of and as_of in available_dates else available_dates[-1]
    eval_idx = available_dates.index(eval_date)

    # Filter data up to eval_date
    active_checkins = [c for c in all_checkins if c.date <= eval_date]

    # Load metric logs up to eval_date
    metric_rows = (
        db.query(MetricLog)
        .filter(MetricLog.student_id == student_id, MetricLog.date <= eval_date)
        .order_by(MetricLog.date.asc())
        .all()
    )

    # Build history per metric (days_ago relative to eval_date)
    history_by_metric = {m: [] for m in ALL_7_METRICS}
    ref_history = {m: [] for m in ALL_7_METRICS}
    series_by_metric = {m: [] for m in ALL_7_METRICS}
    freshness_days = {}

    for r in metric_rows:
        if r.metric in history_by_metric:
            r_idx = available_dates.index(r.date)
            days_ago = eval_idx - r_idx
            series_by_metric[r.metric].append({"date": r.date, "value": r.value})

            # History within last 28 days for baseline
            if days_ago <= 28:
                history_by_metric[r.metric].append({"days_ago": days_ago, "value": r.value})

            # First 21 days as frozen reference
            if r_idx < 21:
                ref_history[r.metric].append({"days_ago": 20 - r_idx, "value": r.value})

            # Track most recent observation for freshness
            if r.metric not in freshness_days or days_ago < freshness_days[r.metric]:
                freshness_days[r.metric] = days_ago

    # 1. Personal Normal Bands
    baselines = compute_all_baselines(
        history_by_metric,
        reference_history=ref_history if eval_idx >= 21 else None
    )

    # Overall baseline confidence
    confidences = [b["confidence"] for b in baselines.values() if b["confidence"] > 0]
    overall_confidence = round(float(np.mean(confidences)), 2) if confidences else 0.0

    # 2. What Changed deltas
    changes_data = compute_changes(history_by_metric, baselines)

    # 3. Behavior Patterns
    pattern_data = detect_patterns(baselines, freshness_days=freshness_days)

    # 4. Quiet Drift Detection (CUSUM)
    drift_data = compute_all_drifts(series_by_metric)

    # 5. Safety Layer Evaluation
    c_recent = [{"date": c.date, "mood": c.mood, "stress": c.stress} for c in active_checkins[-5:]]
    safety_data = evaluate_safety(c_recent)

    # 6. Fingerprint Radar Data (7 axes: current, baseline median, last week ghost)
    radar_data = []
    # Maximum scaling bounds for radar display
    radar_scales = {
        "mood": 5.0, "stress": 5.0, "sleep": 10.0, "study": 10.0,
        "screen": 12.0, "exercise": 60.0, "social": 5.0
    }

    for m in ALL_7_METRICS:
        b = baselines.get(m, {})
        med = b.get("median", 0.0) or 0.0
        recent = b.get("recent_value", med) or med

        # Ghost value: average between days 7 and 14 ago
        past_week_obs = [obs["value"] for obs in history_by_metric[m] if 7 <= obs["days_ago"] < 14]
        ghost_val = float(np.mean(past_week_obs)) if past_week_obs else med

        scale = radar_scales.get(m, 5.0)

        radar_data.append({
            "metric": m.capitalize(),
            "metric_key": m,
            "raw_recent": round(recent, 1),
            "raw_median": round(med, 1),
            "raw_ghost": round(ghost_val, 1),
            # Normalized 0-100 for radar rendering
            "current": round(min(100.0, (recent / scale) * 100), 1),
            "baseline": round(min(100.0, (med / scale) * 100), 1),
            "last_week": round(min(100.0, (ghost_val / scale) * 100), 1)
        })

    # Today's check-in record if available
    today_checkin = next((c for c in active_checkins if c.date == eval_date), None)
    checked_in_today = today_checkin is not None

    # 7. Pattern Memory
    timeline_res = get_timeline_data(student_id=student_id, db=db)
    memory_data = compute_pattern_memory(timeline_res.get("weeks", []), baselines)

    # 8. Personal Levers
    daily_records = []
    for c in active_checkins:
        s_val = c.micro_value if c.micro_key == "sleep" else None
        daily_records.append({"date": c.date, "sleep": s_val, "stress": c.stress})
    levers_data = compute_personal_levers(
        daily_records,
        sleep_median=baselines.get("sleep", {}).get("median", 7.5) or 7.5
    )

    return {
        "student": {
            "student_id": student.student_id,
            "department": student.department,
            "year": student.year,
            "age_range": student.age_range,
            "consent": student.consent
        },
        "as_of": eval_date,
        "total_days_tracked": eval_idx + 1,
        "overall_confidence": overall_confidence,
        "checked_in_today": checked_in_today,
        "today_checkin": {
            "mood": today_checkin.mood if today_checkin else None,
            "stress": today_checkin.stress if today_checkin else None,
            "main_factor": today_checkin.main_factor if today_checkin else None,
            "micro_key": today_checkin.micro_key if today_checkin else None,
            "micro_value": today_checkin.micro_value if today_checkin else None
        } if today_checkin else None,
        "baselines": baselines,
        "radar": radar_data,
        "what_changed": changes_data,
        "pattern": pattern_data,
        "drift": drift_data,
        "memory": memory_data,
        "levers": levers_data,
        "safety": safety_data,
        "available_dates": available_dates
    }


@router.get("/timeline/{student_id}")
def get_timeline_data(student_id: str, db: Session = Depends(get_db)):
    """
    Returns weekly aggregated series across all 7 metrics for timeline graphs.
    """
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    metric_rows = (
        db.query(MetricLog)
        .filter(MetricLog.student_id == student_id)
        .order_by(MetricLog.date.asc())
        .all()
    )

    if not metric_rows:
        return {"weeks": []}

    dates = sorted(list(set(r.date for r in metric_rows)))
    min_dt = datetime.strptime(dates[0], "%Y-%m-%d").date()

    # Bucket into 7-day calendar weeks
    weeks_dict = {}
    for r in metric_rows:
        r_dt = datetime.strptime(r.date, "%Y-%m-%d").date()
        week_num = ((r_dt - min_dt).days // 7) + 1
        if week_num not in weeks_dict:
            weeks_dict[week_num] = {
                "week": week_num,
                "start_date": (min_dt + timedelta(days=(week_num - 1) * 7)).strftime("%Y-%m-%d"),
                "end_date": (min_dt + timedelta(days=week_num * 7 - 1)).strftime("%Y-%m-%d"),
                "raw_values": {m: [] for m in ALL_7_METRICS}
            }
        if r.metric in weeks_dict[week_num]["raw_values"]:
            weeks_dict[week_num]["raw_values"][r.metric].append(r.value)

    # Compute averages
    weeks_list = []
    for w_num in sorted(weeks_dict.keys()):
        w_data = weeks_dict[w_num]
        week_summary = {
            "week": w_num,
            "label": f"Week {w_num}",
            "start_date": w_data["start_date"],
            "end_date": w_data["end_date"]
        }
        for m in ALL_7_METRICS:
            vals = w_data["raw_values"][m]
            week_summary[m] = round(float(np.mean(vals)), 2) if vals else None

        weeks_list.append(week_summary)

    return {"weeks": weeks_list}


@router.get("/insight/{student_id}")
def get_student_insight(
    student_id: str,
    as_of: Optional[str] = Query(None, description="Time-travel date filter (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Returns an evidence-grounded AI wellness reflection with Explanation Receipts.
    Validated against banned clinical words and number hallucinations.
    """
    # 1. Fetch dashboard facts
    dash_data = get_dashboard_data(student_id=student_id, as_of=as_of, db=db)
    if "has_data" in dash_data and not dash_data["has_data"]:
        return {
            "what_changed": "Check-in data is still being gathered.",
            "pattern": "Awaiting initial observations.",
            "factors": "Please complete your first daily check-ins.",
            "suggestions": ["Start with your 3 daily taps."],
            "support": "Drift is here to support you at your own pace.",
            "receipts": []
        }

    # 2. Extract facts payload (strictly anonymized, no student ID, no free text)
    primary_pat = dash_data.get("pattern", {}).get("primary_pattern")
    top_change = dash_data.get("what_changed", {}).get("changes", [])
    primary_drift = dash_data.get("drift", {}).get("primary_drift")

    facts = {
        "as_of": dash_data["as_of"],
        "confidence": dash_data["overall_confidence"],
        "changes": top_change[:3],
        "pattern": primary_pat or {"name": "Relatively balanced behaviour", "description": "Routine aligns with personal band."},
        "drift": primary_drift or {"has_drift": False, "message": "No quiet drift detected."}
    }

    # 3. Generate validated reflection (Gemini with offline fallback)
    insight = generate_wellness_insight(facts)
    return insight
