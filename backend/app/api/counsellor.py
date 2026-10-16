"""
Counsellor View API routes for Drift.
Provides aggregate-only, anonymized departmental wellness trends.
Enforces strict k-anonymity (k >= 5) so that small cohorts are never individually identifiable.
"""

from typing import Dict, List, Any, Optional
from collections import defaultdict
from datetime import datetime
import random
import numpy as np
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Student, Checkin, MetricLog, CounsellorAlert, CounsellorChatMessage

router = APIRouter(prefix="/counsellor", tags=["counsellor"])

MIN_K_ANONYMITY = 5


@router.get("/summary")
def get_counsellor_summary(db: Session = Depends(get_db)):
    """
    Returns anonymized departmental trends.
    Strict privacy: only departments with 5 or more consenting students are displayed.
    Smaller groups are aggregated into 'Other Departments'.
    """
    students = db.query(Student).filter(Student.consent == 1).all()
    if not students:
        return {"total_students": 0, "departments": [], "disclaimer": "Aggregated data only. k >= 5 enforced."}

    # Group students by department
    dept_map = defaultdict(list)
    for s in students:
        dept = s.department or "Unassigned"
        dept_map[dept].append(s.student_id)

    total_consented = len(students)
    department_summaries = []
    other_cohort = []

    for dept_name, sids in dept_map.items():
        if len(sids) < MIN_K_ANONYMITY:
            other_cohort.extend(sids)
        else:
            summary = _compute_dept_stats(dept_name, sids, db)
            department_summaries.append(summary)

    # If small groups were pooled together
    if len(other_cohort) >= MIN_K_ANONYMITY:
        other_summary = _compute_dept_stats("Other Combined Departments", other_cohort, db)
        department_summaries.append(other_summary)

    # Sort descending by student count
    department_summaries.sort(key=lambda x: x["student_count"], reverse=True)

    return {
        "total_students": total_consented,
        "active_departments_tracked": len(department_summaries),
        "k_anonymity_threshold": MIN_K_ANONYMITY,
        "departments": department_summaries,
        "disclaimer": "Aggregate anonymized statistics for campus wellness planning. No individual identifiers."
    }


def _compute_dept_stats(name: str, student_ids: List[str], db: Session) -> Dict[str, Any]:
    """Computes average metrics for an anonymized group of students."""
    # Query check-ins for these students in the last 14 days
    checkins = (
        db.query(Checkin)
        .filter(Checkin.student_id.in_(student_ids))
        .all()
    )

    if not checkins:
        return {
            "department": name,
            "student_count": len(student_ids),
            "avg_stress": 0.0,
            "avg_mood": 0.0,
            "elevated_stress_pct": 0.0
        }

    stresses = [c.stress for c in checkins]
    moods = [c.mood for c in checkins]

    high_stress_count = sum(1 for s in stresses if s >= 4)
    elevated_pct = round((high_stress_count / len(stresses)) * 100, 1) if stresses else 0.0

    return {
        "department": name,
        "student_count": len(student_ids),
        "avg_stress": round(float(np.mean(stresses)), 2),
        "avg_mood": round(float(np.mean(moods)), 2),
        "elevated_stress_pct": elevated_pct
    }


# ---------------------------------------------------------------------------
# Live Counsellor Help Alerts & 1-on-1 Connection Endpoints
# ---------------------------------------------------------------------------


class CreateCounsellorAlertRequest(BaseModel):
    student_id: str
    student_name: Optional[str] = "Student"
    department: Optional[str] = "Computer Science"
    urgency: str = Field(default="High", description="'Urgent' | 'High' | 'Normal'")
    topic: str = Field(..., description="Primary wellness concern or distress reason")
    notes: Optional[str] = ""


class AcceptAlertRequest(BaseModel):
    counsellor_email: str
    counsellor_name: str


class SendAlertMessageRequest(BaseModel):
    sender_role: str = Field(..., description="'student' or 'counsellor'")
    sender_name: str
    sender_id: str
    message: str = Field(..., min_length=1)


@router.post("/alerts")
def raise_counsellor_alert(
    payload: CreateCounsellorAlertRequest,
    db: Session = Depends(get_db)
):
    """
    Broadcasts a real-time distress or help alert from a student to all campus counsellors.
    """
    # Verify student exists
    student = db.query(Student).filter(Student.student_id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    alert_id = f"ALT-{random.randint(1000, 9999)}"
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")

    # If student already has an active open or accepted alert, reuse or return it
    existing_alert = (
        db.query(CounsellorAlert)
        .filter(CounsellorAlert.student_id == payload.student_id, CounsellorAlert.status.in_(["open", "accepted"]))
        .first()
    )
    if existing_alert:
        return {
            "success": True,
            "alert_id": existing_alert.alert_id,
            "status": existing_alert.status,
            "created_at": existing_alert.created_at,
            "urgency": existing_alert.urgency,
            "topic": existing_alert.topic,
            "accepted_by": existing_alert.accepted_by,
            "message": f"Active alert '{existing_alert.alert_id}' is already broadcast to campus counsellors."
        }

    new_alert = CounsellorAlert(
        alert_id=alert_id,
        student_id=payload.student_id,
        student_name=payload.student_name or getattr(student, "name", None) or f"Student {payload.student_id}",
        department=payload.department or student.department or "General Engineering",
        urgency=payload.urgency,
        topic=payload.topic,
        notes=payload.notes or "",
        status="open",
        created_at=now_str
    )
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)

    return {
        "success": True,
        "alert_id": new_alert.alert_id,
        "status": "open",
        "created_at": new_alert.created_at,
        "urgency": new_alert.urgency,
        "topic": new_alert.topic,
        "message": f"Help alert ({alert_id}) has been broadcast to all available campus counsellors."
    }


@router.get("/alerts")
def get_counsellor_alerts(
    status: Optional[str] = None,
    student_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns list of counsellor alerts for the Counsellor Dashboard.
    """
    query = db.query(CounsellorAlert)
    if status and status != "all":
        query = query.filter(CounsellorAlert.status == status)
    if student_id:
        query = query.filter(CounsellorAlert.student_id == student_id)

    alerts = query.order_by(CounsellorAlert.id.desc()).all()

    # Pre-fetch message counts per alert
    result = []
    for a in alerts:
        msg_count = db.query(CounsellorChatMessage).filter(CounsellorChatMessage.alert_id == a.alert_id).count()
        result.append({
            "id": a.id,
            "alert_id": a.alert_id,
            "student_id": a.student_id,
            "student_name": a.student_name or a.student_id,
            "department": a.department,
            "urgency": a.urgency,
            "topic": a.topic,
            "notes": a.notes,
            "status": a.status,
            "created_at": a.created_at,
            "accepted_by": a.accepted_by,
            "accepted_at": a.accepted_at,
            "resolved_at": a.resolved_at,
            "messages_count": msg_count
        })

    return {
        "total_alerts": len(result),
        "open_count": sum(1 for x in result if x["status"] == "open"),
        "accepted_count": sum(1 for x in result if x["status"] == "accepted"),
        "alerts": result
    }


@router.post("/alerts/{alert_id}/accept")
def accept_counsellor_alert(
    alert_id: str,
    payload: AcceptAlertRequest,
    db: Session = Depends(get_db)
):
    """
    A campus counsellor accepts a student's help alert and opens a direct 1-on-1 session.
    """
    alert = db.query(CounsellorAlert).filter(CounsellorAlert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert '{alert_id}' not found.")

    if alert.status == "accepted" and alert.accepted_by and alert.accepted_by != payload.counsellor_name:
        raise HTTPException(
            status_code=400,
            detail=f"This alert has already been accepted by {alert.accepted_by}."
        )

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    alert.status = "accepted"
    alert.accepted_by = payload.counsellor_name
    alert.accepted_at = now_str

    # Create automated initial greeting from counsellor
    greeting_exists = (
        db.query(CounsellorChatMessage)
        .filter(CounsellorChatMessage.alert_id == alert_id)
        .first()
    )
    if not greeting_exists:
        first_msg = CounsellorChatMessage(
            alert_id=alert_id,
            sender_role="counsellor",
            sender_name=payload.counsellor_name,
            sender_id=payload.counsellor_email,
            message=(
                f"Hello! I'm {payload.counsellor_name} from the Student Wellness Centre. "
                "I have accepted your alert and am here with you right now. "
                "You are in a safe, confidential space — how are you feeling?"
            ),
            timestamp=now_str
        )
        db.add(first_msg)

    db.commit()
    db.refresh(alert)

    return {
        "success": True,
        "alert_id": alert.alert_id,
        "status": "accepted",
        "accepted_by": alert.accepted_by,
        "accepted_at": alert.accepted_at,
        "message": f"You are now connected with {alert.student_name or alert.student_id}."
    }


@router.post("/alerts/{alert_id}/resolve")
def resolve_counsellor_alert(
    alert_id: str,
    db: Session = Depends(get_db)
):
    """
    Marks the consultation session as resolved.
    """
    alert = db.query(CounsellorAlert).filter(CounsellorAlert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    alert.status = "resolved"
    alert.resolved_at = now_str
    db.commit()

    return {
        "success": True,
        "alert_id": alert_id,
        "status": "resolved",
        "resolved_at": now_str,
        "message": "Consultation session marked as concluded."
    }


@router.get("/alerts/{alert_id}/messages")
def get_alert_messages(
    alert_id: str,
    db: Session = Depends(get_db)
):
    """
    Fetches the 1-on-1 direct consultation chat messages for this alert.
    """
    alert = db.query(CounsellorAlert).filter(CounsellorAlert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    messages = (
        db.query(CounsellorChatMessage)
        .filter(CounsellorChatMessage.alert_id == alert_id)
        .order_by(CounsellorChatMessage.id.asc())
        .all()
    )

    return {
        "alert_id": alert_id,
        "status": alert.status,
        "student_id": alert.student_id,
        "student_name": alert.student_name,
        "accepted_by": alert.accepted_by,
        "urgency": alert.urgency,
        "topic": alert.topic,
        "messages": [
            {
                "id": m.id,
                "sender_role": m.sender_role,
                "sender_name": m.sender_name,
                "sender_id": m.sender_id,
                "message": m.message,
                "timestamp": m.timestamp
            }
            for m in messages
        ]
    }


@router.post("/alerts/{alert_id}/messages")
def send_alert_message(
    alert_id: str,
    payload: SendAlertMessageRequest,
    db: Session = Depends(get_db)
):
    """
    Sends a real-time message in the 1-on-1 consultation session.
    """
    alert = db.query(CounsellorAlert).filter(CounsellorAlert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    msg = CounsellorChatMessage(
        alert_id=alert_id,
        sender_role=payload.sender_role,
        sender_name=payload.sender_name,
        sender_id=payload.sender_id,
        message=payload.message.strip(),
        timestamp=now_str
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    return {
        "success": True,
        "message": {
            "id": msg.id,
            "alert_id": msg.alert_id,
            "sender_role": msg.sender_role,
            "sender_name": msg.sender_name,
            "sender_id": msg.sender_id,
            "message": msg.message,
            "timestamp": msg.timestamp
        }
    }


@router.get("/student-active-alert/{student_id}")
def get_student_active_alert(
    student_id: str,
    db: Session = Depends(get_db)
):
    """
    Checks if a student currently has an active counsellor alert or connected session.
    """
    active_alert = (
        db.query(CounsellorAlert)
        .filter(
            CounsellorAlert.student_id == student_id,
            CounsellorAlert.status.in_(["open", "accepted"])
        )
        .order_by(CounsellorAlert.id.desc())
        .first()
    )

    if not active_alert:
        return {"has_active_alert": False, "active_alert": None, "alert": None}

    alert_dict = {
        "alert_id": active_alert.alert_id,
        "status": active_alert.status,
        "urgency": active_alert.urgency,
        "topic": active_alert.topic,
        "created_at": active_alert.created_at,
        "accepted_by": active_alert.accepted_by,
        "accepted_at": active_alert.accepted_at
    }

    return {
        "has_active_alert": True,
        "active_alert": alert_dict,
        "alert": alert_dict
    }
