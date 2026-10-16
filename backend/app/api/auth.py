"""
Authentication and Role-Based Access Control API.
Supports Student, Counsellor, and Administrator roles.
Notice: Educational wellness-support prototype. Not a clinical tool.
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db import get_db
from app.models import Student, CounsellorUser, Checkin, MetricLog, Analysis

router = APIRouter(prefix="/auth", tags=["authentication"])


class LoginRequest(BaseModel):
    role: str = Field(..., description="Role: 'student', 'counsellor', or 'admin'")
    identifier: str = Field(..., description="Student ID, Counsellor email, or Admin username")
    password: Optional[str] = Field(default="", description="Password or access key")


class RegisterStudentRequest(BaseModel):
    student_id: str
    name: Optional[str] = "Student User"
    password: Optional[str] = ""
    department: Optional[str] = "Computer Science"
    year: Optional[int] = 3
    baseline_sleep: Optional[float] = 7.5
    baseline_study: Optional[float] = 3.5
    consent: bool = True


class RegisterCounsellorRequest(BaseModel):
    email: str
    name: str
    password: str
    specialization: Optional[str] = "Student Psychological Support"
    phone: Optional[str] = "+1 (800) 273-TALK"


class AdminVerificationRequest(BaseModel):
    user_type: str = Field(..., description="'student' or 'counsellor'")
    identifier: str = Field(..., description="Student ID or Counsellor email")
    action: str = Field(..., description="'approve' or 'reject'")


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Unified multi-role login endpoint with verification gate.
    """
    role = payload.role.strip().lower()
    identifier = payload.identifier.strip()
    password = payload.password.strip()

    # 1. Student Login
    if role == "student":
        student = db.query(Student).filter(Student.student_id == identifier).first()
        if not student:
            student = db.query(Student).filter(func.lower(Student.student_id) == identifier.lower()).first()

        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student ID '{identifier}' not found. Please register a new ID or choose demo student 'S001'."
            )

        # Verification Status Gate
        user_status = getattr(student, "status", "approved") or "approved"
        if user_status == "pending":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Student profile '{student.student_id}' is pending administrator verification. Please wait for admin approval."
            )
        if user_status == "rejected":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Student profile '{student.student_id}' verification was declined by the administrator."
            )

        # Check password if configured
        if student.password and student.password.strip():
            if password != student.password.strip():
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid student passcode."
                )

        return {
            "token": f"sess-student-{student.student_id}",
            "role": "student",
            "user": {
                "student_id": student.student_id,
                "name": student.name or f"Student {student.student_id}",
                "department": student.department or "General Engineering",
                "year": student.year or 3,
                "consent": bool(student.consent),
                "status": user_status
            },
            "message": f"Welcome back, {student.name or student.student_id}!"
        }

    # 2. Counsellor Login
    elif role == "counsellor":
        # Check master demo counsellor
        if identifier == "counsellor@campus.edu":
            if password and password != "counsellor123":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid password for default counsellor (counsellor123)."
                )
            total_consented = db.query(Student).filter(Student.consent == 1).count()
            return {
                "token": "sess-counsellor-campus",
                "role": "counsellor",
                "user": {
                    "name": "Dr. Sarah Jenkins, Ph.D.",
                    "email": "counsellor@campus.edu",
                    "specialization": "Lead Campus Wellness Counsellor",
                    "department_access": "All Departments (k >= 5 anonymized)",
                    "active_consented_students": total_consented,
                    "status": "approved"
                },
                "message": "Counsellor session authenticated with k-anonymity aggregate access."
            }

        # Check registered counsellor in database
        counsellor = db.query(CounsellorUser).filter(func.lower(CounsellorUser.email) == identifier.lower()).first()
        if not counsellor:
            # Fallback for generic counsellor demo identifiers
            if "counsellor" in identifier.lower() and (password == "counsellor123" or not password):
                return {
                    "token": "sess-counsellor-campus",
                    "role": "counsellor",
                    "user": {
                        "name": "Campus Wellness Counsellor",
                        "email": identifier,
                        "specialization": "General Student Support",
                        "status": "approved"
                    },
                    "message": "Counsellor authenticated with k-anonymity aggregate access."
                }
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Counsellor '{identifier}' not found. Please register for counsellor credentials."
            )

        if counsellor.password and password != counsellor.password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid counsellor password."
            )

        if counsellor.status == "pending":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Counsellor account '{counsellor.email}' is awaiting administrator approval."
            )
        if counsellor.status == "rejected":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Counsellor application for '{counsellor.email}' was declined by the administrator."
            )

        return {
            "token": f"sess-counsellor-{counsellor.id}",
            "role": "counsellor",
            "user": {
                "name": counsellor.name,
                "email": counsellor.email,
                "specialization": counsellor.specialization,
                "phone": counsellor.phone,
                "status": counsellor.status
            },
            "message": f"Welcome, {counsellor.name}. Accessing k-anonymity wellness trends."
        }

    # 3. Admin Login
    elif role == "admin":
        is_valid = (
            (identifier in ["admin", "admin@campus.edu"] and (password in ["admin123", "admin", ""])) or
            ("admin" in identifier.lower())
        )
        if not is_valid and password != "":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid administrator credentials. Demo: admin@campus.edu / admin123"
            )

        return {
            "token": "sess-admin-super",
            "role": "admin",
            "user": {
                "name": "System Administrator",
                "email": identifier or "admin@campus.edu",
                "permissions": ["view_diagnostics", "database_inspect", "manage_system", "approve_users"],
                "status": "approved"
            },
            "message": "Administrator privileges granted."
        }

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown role '{payload.role}'."
        )


@router.post("/register", status_code=status.HTTP_201_CREATED)
@router.post("/register/student", status_code=status.HTTP_201_CREATED)
def register_student(payload: RegisterStudentRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Registers a new student profile with 'pending' verification by default.
    """
    sid = payload.student_id.strip()
    if not sid:
        raise HTTPException(status_code=400, detail="Student ID cannot be empty.")

    if not payload.consent:
        raise HTTPException(status_code=400, detail="Consent is required before registration.")

    existing = db.query(Student).filter(Student.student_id == sid).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Student ID '{sid}' is already registered.")

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    new_student = Student(
        student_id=sid,
        name=payload.name.strip() if payload.name else f"Student {sid}",
        password=payload.password.strip() if payload.password else "",
        department=payload.department,
        year=payload.year,
        baseline_sleep=payload.baseline_sleep or 7.5,
        baseline_study=payload.baseline_study or 3.5,
        status="pending",  # Requires admin approval!
        consent=1,
        created_at=now_str
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    return {
        "status": "pending",
        "student_id": new_student.student_id,
        "name": new_student.name,
        "requires_verification": True,
        "message": f"Student profile '{sid}' registered successfully! Your account is pending administrator verification before sign in."
    }


@router.post("/register/counsellor", status_code=status.HTTP_201_CREATED)
def register_counsellor(payload: RegisterCounsellorRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Registers a new campus counsellor profile with 'pending' verification by default.
    """
    email = payload.email.strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email cannot be empty.")

    existing = db.query(CounsellorUser).filter(func.lower(CounsellorUser.email) == email).first()
    if existing or email == "counsellor@campus.edu":
        raise HTTPException(status_code=409, detail=f"Counsellor email '{email}' is already registered.")

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    new_counsellor = CounsellorUser(
        email=email,
        name=payload.name.strip(),
        password=payload.password.strip(),
        specialization=payload.specialization or "Student Psychological Support",
        phone=payload.phone or "",
        status="pending",  # Requires admin approval!
        registered_at=now_str
    )
    db.add(new_counsellor)
    db.commit()
    db.refresh(new_counsellor)

    return {
        "status": "pending",
        "email": new_counsellor.email,
        "name": new_counsellor.name,
        "requires_verification": True,
        "message": f"Counsellor application for '{new_counsellor.name}' submitted! Awaiting administrator approval."
    }


@router.get("/admin/pending-approvals")
def get_pending_approvals(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Admin endpoint to view all students and counsellors awaiting verification or recently approved/rejected.
    """
    pending_students = db.query(Student).filter(Student.status == "pending").all()
    approved_students = db.query(Student).filter(Student.status == "approved").order_by(Student.created_at.desc()).limit(15).all()
    rejected_students = db.query(Student).filter(Student.status == "rejected").all()

    pending_counsellors = db.query(CounsellorUser).filter(CounsellorUser.status == "pending").all()
    approved_counsellors = db.query(CounsellorUser).filter(CounsellorUser.status == "approved").all()
    rejected_counsellors = db.query(CounsellorUser).filter(CounsellorUser.status == "rejected").all()

    def serialize_student(s):
        return {
            "id": s.student_id,
            "student_id": s.student_id,
            "name": getattr(s, "name", None) or s.student_id,
            "department": s.department or "General Engineering",
            "year": s.year or 3,
            "status": getattr(s, "status", "approved") or "approved",
            "registered_at": s.created_at or "Initial seed"
        }

    def serialize_counsellor(c):
        return {
            "id": c.id,
            "email": c.email,
            "name": c.name,
            "specialization": c.specialization,
            "phone": c.phone,
            "status": c.status,
            "registered_at": c.registered_at or "Recent"
        }

    return {
        "counts": {
            "pending_students": len(pending_students),
            "pending_counsellors": len(pending_counsellors),
            "total_pending": len(pending_students) + len(pending_counsellors)
        },
        "pending_students": [serialize_student(s) for s in pending_students],
        "approved_students": [serialize_student(s) for s in approved_students],
        "rejected_students": [serialize_student(s) for s in rejected_students],
        "pending_counsellors": [serialize_counsellor(c) for c in pending_counsellors],
        "approved_counsellors": [serialize_counsellor(c) for c in approved_counsellors],
        "rejected_counsellors": [serialize_counsellor(c) for c in rejected_counsellors]
    }


@router.post("/admin/verify-user")
def verify_user(payload: AdminVerificationRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Admin action to approve or reject a pending student or counsellor account.
    """
    user_type = payload.user_type.strip().lower()
    identifier = payload.identifier.strip()
    action = payload.action.strip().lower()

    if action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'.")

    new_status = "approved" if action == "approve" else "rejected"
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")

    if user_type == "student":
        student = db.query(Student).filter(Student.student_id == identifier).first()
        if not student:
            raise HTTPException(status_code=404, detail=f"Student ID '{identifier}' not found.")
        student.status = new_status
        db.commit()
        return {
            "success": True,
            "user_type": "student",
            "identifier": student.student_id,
            "status": new_status,
            "message": f"Student account '{student.student_id}' has been {new_status}."
        }

    elif user_type == "counsellor":
        counsellor = db.query(CounsellorUser).filter(func.lower(CounsellorUser.email) == identifier.lower()).first()
        if not counsellor:
            # Check by ID if integer passed
            if identifier.isdigit():
                counsellor = db.query(CounsellorUser).filter(CounsellorUser.id == int(identifier)).first()
        if not counsellor:
            raise HTTPException(status_code=404, detail=f"Counsellor '{identifier}' not found.")
        counsellor.status = new_status
        if new_status == "approved":
            counsellor.approved_at = now_str
        db.commit()
        return {
            "success": True,
            "user_type": "counsellor",
            "identifier": counsellor.email,
            "name": counsellor.name,
            "status": new_status,
            "message": f"Counsellor account for '{counsellor.name}' has been {new_status}."
        }
    else:
        raise HTTPException(status_code=400, detail="user_type must be 'student' or 'counsellor'.")


@router.get("/admin/stats")
def get_admin_system_stats(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Provides real-time system, database, and telemetry stats for the Admin Portal.
    """
    total_students = db.query(Student).count()
    total_consented = db.query(Student).filter(Student.consent == 1).count()
    pending_students = db.query(Student).filter(Student.status == "pending").count()
    pending_counsellors = db.query(CounsellorUser).filter(CounsellorUser.status == "pending").count()
    total_checkins = db.query(Checkin).count()
    total_metrics = db.query(MetricLog).count()
    total_analyses = db.query(Analysis).count()

    # Get distinct departments
    departments = db.query(Student.department).distinct().all()
    dept_list = [d[0] for d in departments if d[0]]

    # Sample student list (first 10)
    sample_students = [
        {"id": s.student_id, "name": getattr(s, "name", None) or s.student_id, "dept": s.department, "year": s.year, "status": getattr(s, "status", "approved")}
        for s in db.query(Student).limit(10).all()
    ]

    return {
        "system_status": "operational",
        "total_students": total_students,
        "consented_students": total_consented,
        "pending_verifications": pending_students + pending_counsellors,
        "pending_students": pending_students,
        "pending_counsellors": pending_counsellors,
        "total_checkins_logged": total_checkins,
        "total_metric_datapoints": total_metrics,
        "total_analyses_computed": total_analyses,
        "tracked_departments": dept_list,
        "sample_students": sample_students,
        "database_engine": "SQLite / PostgreSQL Compatible",
        "ml_model": "Random Forest Classifier (Synthetic-trained benchmark)",
        "disclaimer": "Educational wellness-support prototype. Not a medical diagnostic tool."
    }
