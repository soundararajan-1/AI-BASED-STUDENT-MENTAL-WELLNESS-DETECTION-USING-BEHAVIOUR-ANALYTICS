"""
Database Seeding Script for Drift.
Populates SQLite with:
- 40 synthetic student personas across 60 days of longitudinal check-in data
- 1 hand-crafted demo student 'S001' featuring a clear 5-week behavioral decline
- Metric logs from daily taps and rotating micro-questions
- Question logs with reasoning for each micro-question asked

Run with: python backend/simulator/seed.py
"""

import sys
import os
from pathlib import Path
from datetime import datetime, timedelta

# Ensure backend directory is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.db import SessionLocal, init_db, engine, Base
from app.models import Student, Checkin, MetricLog, QuestionLog
from simulator.personas import (
    create_demo_student_s001,
    generate_s001_day,
    create_synthetic_cohort,
    select_main_factor,
    ROTATING_MICRO_KEYS
)


def seed_database(reference_end_date: str = "2026-10-01", total_days: int = 60):
    """
    Cleans and seeds the database with all personas and check-ins.
    """
    print(f"Initializing database tables...")
    init_db()

    db = SessionLocal()

    try:
        # Clear existing data for a clean, deterministic seed
        print("Clearing previous seed data...")
        db.query(QuestionLog).delete()
        db.query(MetricLog).delete()
        db.query(Checkin).delete()
        db.query(Student).delete()
        db.commit()

        end_dt = datetime.strptime(reference_end_date, "%Y-%m-%d").date()
        start_dt = end_dt - timedelta(days=total_days - 1)

        # 1. Setup Student Cohort: S001 + 40 synthetic personas = 41 students
        s001 = create_demo_student_s001()
        cohort = [s001] + create_synthetic_cohort()

        print(f"Seeding {len(cohort)} students over {total_days} days (from {start_dt} to {end_dt})...")

        for persona in cohort:
            # Create Student profile record
            student_rec = Student(
                student_id=persona.student_id,
                name="Alex Morgan" if persona.student_id == "S001" else f"Student {persona.student_id}",
                password="student123",
                status="approved",
                year=persona.year,
                department=persona.department,
                age_range=persona.age_range,
                baseline_sleep=persona.base_sleep,
                baseline_study=persona.base_study,
                consent=1,  # Consented
                created_at=f"{start_dt}T08:00:00"
            )
            db.add(student_rec)

            # Generate 60 days of check-ins and metric logs
            for day_idx in range(total_days):
                curr_date_str = (start_dt + timedelta(days=day_idx)).strftime("%Y-%m-%d")

                # Get true daily values
                if persona.student_id == "S001":
                    day_vals = generate_s001_day(day_idx)
                else:
                    day_vals = persona.generate_day(day_idx)

                # Select main factor for today's check-in
                main_factor = select_main_factor(day_vals)

                # Determine rotating micro-question
                # If during S001's decline or high stress, prioritize sleep / study
                if persona.student_id == "S001" and day_idx >= 21 and (day_idx % 2 == 0):
                    micro_key = "sleep"
                    reason = "Monitoring recent shift in your personal rest pattern"
                elif day_vals["stress"] >= 4 and day_vals["mood"] <= 2:
                    micro_key = "sleep" if day_vals["sleep"] <= 6.0 else "study"
                    reason = f"Your stress is elevated, checking {micro_key} to understand context"
                else:
                    micro_key = ROTATING_MICRO_KEYS[day_idx % len(ROTATING_MICRO_KEYS)]
                    reason = f"Scheduled rotation check for {micro_key}"

                micro_value = float(day_vals[micro_key])

                # 1. Add Checkin record (3 taps + 1 micro-answer)
                checkin_rec = Checkin(
                    student_id=persona.student_id,
                    date=curr_date_str,
                    mood=int(day_vals["mood"]),
                    stress=int(day_vals["stress"]),
                    main_factor=main_factor,
                    micro_key=micro_key,
                    micro_value=micro_value
                )
                db.add(checkin_rec)

                # 2. Add MetricLog records
                # Daily taps always logged
                db.add(MetricLog(
                    student_id=persona.student_id,
                    date=curr_date_str,
                    metric="mood",
                    value=float(day_vals["mood"])
                ))
                db.add(MetricLog(
                    student_id=persona.student_id,
                    date=curr_date_str,
                    metric="stress",
                    value=float(day_vals["stress"])
                ))
                # Rotating micro question logged
                db.add(MetricLog(
                    student_id=persona.student_id,
                    date=curr_date_str,
                    metric=micro_key,
                    value=micro_value
                ))

                # Onboarding Day 0: log initial readings for all other metrics
                if day_idx == 0:
                    for m_key in ROTATING_MICRO_KEYS:
                        if m_key != micro_key:
                            db.add(MetricLog(
                                student_id=persona.student_id,
                                date=curr_date_str,
                                metric=m_key,
                                value=float(day_vals[m_key])
                            ))

                # Escalation support: on high-stress days, log one extra response if offered
                if day_vals["stress"] >= 4 and day_vals["mood"] <= 2:
                    escalated_key = "study" if micro_key != "study" else "screen"
                    db.add(MetricLog(
                        student_id=persona.student_id,
                        date=curr_date_str,
                        metric=escalated_key,
                        value=float(day_vals[escalated_key])
                    ))

                # 3. Add QuestionLog record
                db.add(QuestionLog(
                    student_id=persona.student_id,
                    date=curr_date_str,
                    question_key=micro_key,
                    reason_asked=reason,
                    answer=str(micro_value)
                ))

        db.commit()
        print("Seeding completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()


def print_summary():
    """
    Prints table row counts and demo student S001's last 10 days of check-ins.
    """
    db = SessionLocal()
    try:
        student_count = db.query(Student).count()
        checkin_count = db.query(Checkin).count()
        metric_log_count = db.query(MetricLog).count()
        question_log_count = db.query(QuestionLog).count()

        print("\n" + "=" * 60)
        print("DATABASE ROW COUNTS")
        print("=" * 60)
        print(f"Students table:      {student_count} records")
        print(f"Checkins table:      {checkin_count} records")
        print(f"MetricLog table:     {metric_log_count} records")
        print(f"QuestionLog table:   {question_log_count} records")
        print("=" * 60)

        # Print demo student S001's last 10 days
        print("\n" + "=" * 60)
        print("DEMO STUDENT S001: LAST 10 DAYS OF CHECK-INS")
        print("=" * 60)
        recent_checkins = (
            db.query(Checkin)
            .filter(Checkin.student_id == "S001")
            .order_by(Checkin.date.desc())
            .limit(10)
            .all()
        )

        header = f"{'Date':<12} | {'Mood':<5} | {'Stress':<6} | {'Factor':<10} | {'Micro Metric':<12} | {'Micro Value':<10}"
        print(header)
        print("-" * len(header))
        for c in reversed(recent_checkins):
            print(f"{c.date:<12} | {c.mood:<5} | {c.stress:<6} | {str(c.main_factor):<10} | {str(c.micro_key):<12} | {c.micro_value:<10.1f}")
        print("=" * 60 + "\n")

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
    print_summary()
