"""
SQLAlchemy database models for AI-Based Student Mental Wellness Detection.
Defines schemas for students, checkins, metric logs, baselines, analyses, and adaptive questions.
Notice: Educational wellness-support prototype. Not a medical diagnostic tool.
"""

from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    Text,
    UniqueConstraint,
    ForeignKey,
    Index
)
from app.db import Base


class Student(Base):
    """
    Student profile with consent flag and initial baseline indicators.
    Table: students (Section 22)
    """
    __tablename__ = "students"

    student_id = Column(String, primary_key=True, index=True)
    department = Column(String, nullable=True)
    year = Column(Integer, nullable=True)
    age_range = Column(String, nullable=True)

    # Initial personal baseline metrics
    baseline_sleep = Column(Float, nullable=True, default=7.5)
    baseline_study = Column(Float, nullable=True, default=3.5)
    baseline_screen = Column(Float, nullable=True, default=4.0)
    baseline_exercise = Column(Float, nullable=True, default=1.0)
    baseline_social = Column(Float, nullable=True, default=3.0)
    baseline_mood = Column(Float, nullable=True, default=4.0)
    baseline_stress = Column(Float, nullable=True, default=2.0)

    name = Column(String, nullable=True)
    password = Column(String, nullable=True)
    status = Column(String, nullable=False, default="approved")  # 'approved' | 'pending' | 'rejected'
    consent = Column(Integer, nullable=False, default=1)
    created_at = Column(String, nullable=True)


class CounsellorUser(Base):
    """
    Campus Counsellor account credentials with Admin verification status.
    """
    __tablename__ = "counsellor_users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    password = Column(String, nullable=False)
    specialization = Column(String, nullable=True, default="Student Psychological Support")
    phone = Column(String, nullable=True)
    status = Column(String, nullable=False, default="pending")  # 'pending' | 'approved' | 'rejected'
    registered_at = Column(String, nullable=True)
    approved_at = Column(String, nullable=True)


class CounsellorAlert(Base):
    """
    Live distress or help alert broadcasted by a student to all campus counsellors.
    """
    __tablename__ = "counsellor_alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    alert_id = Column(String, unique=True, index=True, nullable=False)
    student_id = Column(String, nullable=False, index=True)
    student_name = Column(String, nullable=True)
    department = Column(String, nullable=True)
    urgency = Column(String, nullable=False, default="High")  # 'Urgent' | 'High' | 'Normal'
    topic = Column(String, nullable=False)                    # e.g. 'Exam Breakdown', 'Emotional Crisis'
    notes = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="open")   # 'open' | 'accepted' | 'resolved'
    created_at = Column(String, nullable=False)
    accepted_by = Column(String, nullable=True)               # Counsellor email / name
    accepted_at = Column(String, nullable=True)
    resolved_at = Column(String, nullable=True)


class CounsellorChatMessage(Base):
    """
    1-on-1 direct consultation chat messages between student and accepted counsellor.
    """
    __tablename__ = "counsellor_chat_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    alert_id = Column(String, nullable=False, index=True)
    sender_role = Column(String, nullable=False)             # 'student' | 'counsellor'
    sender_name = Column(String, nullable=False)
    sender_id = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(String, nullable=False)


class Checkin(Base):
    """
    Daily check-in record containing core taps (mood, stress, main factor)
    and detailed behavioral features (sleep, study, screen, exercise, social, academic pressure).
    Table: checkins (Section 22)
    """
    __tablename__ = "checkins"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String, ForeignKey("students.student_id"), nullable=False, index=True)
    date = Column(String, nullable=False, index=True)  # Format: YYYY-MM-DD
    timestamp = Column(String, nullable=True)

    # Quick daily check-in (Section 8)
    mood = Column(Integer, nullable=False)            # 1 to 5
    stress = Column(Integer, nullable=False)          # 1 to 5
    main_factor = Column(String, nullable=True)       # 'Studies', 'Sleep', 'Social', 'Screen', etc.

    # Detailed behavioral metrics (Section 9)
    sleep_hours = Column(Float, nullable=True)
    study_hours = Column(Float, nullable=True)
    screen_time = Column(Float, nullable=True)
    exercise = Column(Float, nullable=True)
    social_interaction = Column(Float, nullable=True)
    academic_pressure = Column(Integer, nullable=True)

    # Rotating micro question support
    micro_key = Column(String, nullable=True)
    micro_value = Column(Float, nullable=True)

    __table_args__ = (
        UniqueConstraint("student_id", "date", name="uq_student_date"),
    )


class MetricLog(Base):
    """
    Granular log of individual metric measurements captured via taps or micro-questions.
    Used for rolling personal baseline calculations.
    """
    __tablename__ = "metric_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String, nullable=False, index=True)
    date = Column(String, nullable=False, index=True)
    metric = Column(String, nullable=False, index=True)  # mood, stress, sleep, study, screen, exercise, social
    value = Column(Float, nullable=False)

    __table_args__ = (
        Index("idx_metric_log_student_metric_date", "student_id", "metric", "date"),
    )


class Baseline(Base):
    """
    Personal normal band (median, spread) and confidence score calculated per metric per student.
    Table: baselines
    """
    __tablename__ = "baselines"

    student_id = Column(String, primary_key=True)
    metric = Column(String, primary_key=True)
    median = Column(Float, nullable=False)
    spread = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)  # 0.0 to 1.0
    updated_at = Column(String, nullable=True)


class Analysis(Base):
    """
    Comprehensive daily behavioral analysis output.
    Table: behaviour_analysis (Section 22)
    """
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String, ForeignKey("students.student_id"), nullable=False, index=True)
    date = Column(String, nullable=False, index=True)
    checkin_id = Column(Integer, nullable=True)

    wellness_indicator = Column(Float, nullable=True)  # 0 to 100
    wellness_category = Column(String, nullable=True)   # Low / Moderate / Higher wellness concern
    detected_pattern = Column(String, nullable=True)

    changes_json = Column(Text, nullable=True)         # Serialized parameter deltas
    trend_json = Column(Text, nullable=True)           # 7d / 14d / 30d trend slopes
    deviations_json = Column(Text, nullable=True)
    drift_json = Column(Text, nullable=True)
    similar_week = Column(String, nullable=True)
    explanation = Column(Text, nullable=True)
    evidence_json = Column(Text, nullable=True)
    safety_flag = Column(Integer, default=0)
    created_at = Column(String, nullable=True)

    __table_args__ = (
        Index("idx_analyses_student_date", "student_id", "date"),
    )


class AdaptiveQuestion(Base):
    """
    Adaptive follow-up questions contextually triggered when unusual deviations are detected.
    Table: adaptive_questions (Section 22)
    """
    __tablename__ = "adaptive_questions"

    question_id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String, ForeignKey("students.student_id"), nullable=False, index=True)
    checkin_id = Column(Integer, nullable=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=True)
    trigger_reason = Column(String, nullable=True)
    created_at = Column(String, nullable=True)


class QuestionLog(Base):
    """
    Log of micro-questions selected by the Question Budget Engine and the rationale for asking.
    """
    __tablename__ = "question_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String, nullable=False, index=True)
    date = Column(String, nullable=False)
    question_key = Column(String, nullable=False)
    reason_asked = Column(String, nullable=True)
    answer = Column(String, nullable=True)
