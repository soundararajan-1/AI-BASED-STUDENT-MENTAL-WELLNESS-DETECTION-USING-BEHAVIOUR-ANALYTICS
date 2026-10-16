"""
API routes for student profile management and consent enforcement.
Privacy-focused: enforces consent requirements and provides data deletion capabilities.
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Student, Checkin, MetricLog, Baseline, Analysis, QuestionLog
from app.schemas import StudentCreate, StudentResponse

router = APIRouter(prefix="/students", tags=["students"])


@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(student_in: StudentCreate, db: Session = Depends(get_db)):
    """
    Creates a new student profile.
    CRITICAL: Requires explicit user consent before any record is stored.
    """
    if not student_in.consent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Informed consent is required before creating a student profile."
        )

    # Check for existing profile
    existing = db.query(Student).filter(Student.student_id == student_in.student_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Student ID '{student_in.student_id}' already exists."
        )

    now_str = datetime.now().isoformat()
    new_student = Student(
        student_id=student_in.student_id,
        year=student_in.year,
        department=student_in.department,
        age_range=student_in.age_range,
        baseline_sleep=student_in.baseline_sleep,
        baseline_study=student_in.baseline_study,
        consent=1 if student_in.consent else 0,
        created_at=now_str
    )

    db.add(new_student)

    # Seed initial metric log entries if onboarding values were provided
    today_str = datetime.now().strftime("%Y-%m-%d")
    if student_in.baseline_sleep is not None:
        db.add(MetricLog(
            student_id=student_in.student_id,
            date=today_str,
            metric="sleep",
            value=float(student_in.baseline_sleep)
        ))
    if student_in.baseline_study is not None:
        db.add(MetricLog(
            student_id=student_in.student_id,
            date=today_str,
            metric="study",
            value=float(student_in.baseline_study)
        ))

    db.commit()
    db.refresh(new_student)
    return new_student


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: str, db: Session = Depends(get_db)):
    """Retrieves student profile."""
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student ID '{student_id}' not found."
        )
    return student


@router.delete("/{student_id}")
def delete_student_data(student_id: str, db: Session = Depends(get_db)):
    """
    Privacy Checklist: 'Delete my data' action.
    Completely purges all student rows from all 6 tables.
    """
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student ID '{student_id}' not found."
        )

    db.query(QuestionLog).filter(QuestionLog.student_id == student_id).delete()
    db.query(Analysis).filter(Analysis.student_id == student_id).delete()
    db.query(Baseline).filter(Baseline.student_id == student_id).delete()
    db.query(MetricLog).filter(MetricLog.student_id == student_id).delete()
    db.query(Checkin).filter(Checkin.student_id == student_id).delete()
    db.query(Student).filter(Student.student_id == student_id).delete()

    db.commit()
    return {"status": "success", "message": f"All data for student '{student_id}' has been permanently deleted."}
