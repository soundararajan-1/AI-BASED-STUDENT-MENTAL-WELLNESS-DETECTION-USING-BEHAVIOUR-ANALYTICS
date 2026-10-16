"""
API routes for daily check-ins and the Question Budget Engine.
"""

from datetime import datetime, timedelta
from typing import Dict, Any, List
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Student, Checkin, MetricLog, QuestionLog, Analysis
from app.schemas import CheckinCreate, CheckinResponse
from app.engines.questions import select_daily_micro_question, CANDIDATE_QUESTIONS
from app.engines.baseline import compute_all_baselines
from app.engines.changes import compute_changes
from app.engines.patterns import detect_patterns
from app.engines.drift import compute_cusum_for_metric
from app.safety.safety import evaluate_safety

router = APIRouter(tags=["checkins"])


@router.get("/checkin/question/{student_id}")
def get_daily_question(student_id: str, db: Session = Depends(get_db)):
    """
    Selects today's rotating micro-question for the student based on staleness,
    recent deviations, and importance weights.
    """
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    today_str = datetime.now().strftime("%Y-%m-%d")

    # Check last measurement date for each rotating micro metric
    candidate_keys = list(CANDIDATE_QUESTIONS.keys())
    staleness_dict = {}

    for k in candidate_keys:
        latest = (
            db.query(MetricLog)
            .filter(MetricLog.student_id == student_id, MetricLog.metric == k)
            .order_by(MetricLog.date.desc())
            .first()
        )
        if latest:
            try:
                latest_dt = datetime.strptime(latest.date, "%Y-%m-%d").date()
                curr_dt = datetime.strptime(today_str, "%Y-%m-%d").date()
                diff_days = (curr_dt - latest_dt).days
                staleness_dict[k] = max(0, diff_days)
            except Exception:
                staleness_dict[k] = 3
        else:
            staleness_dict[k] = 7  # Not recently measured

    # Check recent checkin to see if stress is elevated
    recent_checkin = (
        db.query(Checkin)
        .filter(Checkin.student_id == student_id)
        .order_by(Checkin.date.desc())
        .first()
    )
    last_stress = recent_checkin.stress if recent_checkin else 2
    last_mood = recent_checkin.mood if recent_checkin else 4
    last_factor = recent_checkin.main_factor if recent_checkin else None

    # Check if sleep is drifting
    sleep_rows = (
        db.query(MetricLog)
        .filter(MetricLog.student_id == student_id, MetricLog.metric == "sleep")
        .order_by(MetricLog.date.asc())
        .all()
    )
    flagged = []
    if len(sleep_rows) >= 14:
        drift_res = compute_cusum_for_metric([{"date": r.date, "value": r.value} for r in sleep_rows], "sleep")
        if drift_res["has_drift"]:
            flagged.append("sleep")

    question_res = select_daily_micro_question(
        last_asked_days_ago=staleness_dict,
        flagged_metrics=flagged,
        today_main_factor=last_factor,
        today_stress=last_stress,
        today_mood=last_mood
    )

    return question_res


@router.post("/checkin")
def submit_checkin(checkin_in: CheckinCreate, db: Session = Depends(get_db)):
    """
    Submits daily check-in (mood, stress, main factor, rotating micro question response).
    Immediately updates metric logs and triggers real-time analysis engines.
    """
    student = db.query(Student).filter(Student.student_id == checkin_in.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if not student.consent:
        raise HTTPException(status_code=403, detail="Active consent is required to log wellness data.")

    # Check if a checkin already exists for this date; update or insert
    existing = (
        db.query(Checkin)
        .filter(Checkin.student_id == checkin_in.student_id, Checkin.date == checkin_in.date)
        .first()
    )
    if existing:
        existing.mood = checkin_in.mood
        existing.stress = checkin_in.stress
        existing.main_factor = checkin_in.main_factor
        existing.micro_key = checkin_in.micro_key
        existing.micro_value = checkin_in.micro_value
    else:
        new_c = Checkin(
            student_id=checkin_in.student_id,
            date=checkin_in.date,
            mood=checkin_in.mood,
            stress=checkin_in.stress,
            main_factor=checkin_in.main_factor,
            micro_key=checkin_in.micro_key,
            micro_value=checkin_in.micro_value
        )
        db.add(new_c)

    # Insert MetricLog rows
    db.add(MetricLog(
        student_id=checkin_in.student_id,
        date=checkin_in.date,
        metric="mood",
        value=float(checkin_in.mood)
    ))
    db.add(MetricLog(
        student_id=checkin_in.student_id,
        date=checkin_in.date,
        metric="stress",
        value=float(checkin_in.stress)
    ))
    if checkin_in.micro_key and checkin_in.micro_value is not None:
        db.add(MetricLog(
            student_id=checkin_in.student_id,
            date=checkin_in.date,
            metric=checkin_in.micro_key,
            value=float(checkin_in.micro_value)
        ))

    db.commit()

    # Safety check on recent checkins
    recent_checkins = (
        db.query(Checkin)
        .filter(Checkin.student_id == checkin_in.student_id)
        .order_by(Checkin.date.asc())
        .all()
    )
    c_list = [{"date": c.date, "mood": c.mood, "stress": c.stress} for c in recent_checkins]
    safety_res = evaluate_safety(c_list)

    return {
        "status": "success",
        "message": "Daily check-in saved successfully.",
        "safety": safety_res,
        "checkin": {
            "student_id": checkin_in.student_id,
            "date": checkin_in.date,
            "mood": checkin_in.mood,
            "stress": checkin_in.stress,
            "main_factor": checkin_in.main_factor,
            "micro_key": checkin_in.micro_key,
            "micro_value": checkin_in.micro_value
        }
    }
