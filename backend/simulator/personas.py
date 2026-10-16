"""
Persona Simulator for Drift: Student Wellness Early-Warning System.
Generates 40 synthetic student personas across 60 days with realistic personal baselines
and injected behavioral events, plus a hand-crafted demo student 'S001'.

Notice: This is an educational wellness-support prototype, not a medical diagnostic tool.
All data generated is synthetic for algorithmic testing and evaluation.
"""

import random
from typing import Dict, List, Any, Optional

DEPARTMENTS = [
    "Computer Science",
    "Mechanical Engineering",
    "Psychology",
    "Business Administration",
    "Biology",
    "Electrical Engineering",
    "Literature & Arts"
]

AGE_RANGES = ["18-20", "20-22", "22-25"]
ROTATING_MICRO_KEYS = ["sleep", "study", "screen", "exercise", "social"]


class StudentPersona:
    """
    Represents an individual student with a unique personal baseline
    and optional injected behavioral event.
    """
    def __init__(
        self,
        student_id: str,
        year: int,
        department: str,
        age_range: str,
        base_sleep: float,
        base_study: float,
        base_stress: float,
        base_mood: float,
        base_screen: float,
        base_exercise: float,
        base_social: float,
        event_type: str = "control",
        event_start_day: Optional[int] = None,
        event_duration: Optional[int] = None,
    ):
        self.student_id = student_id
        self.year = year
        self.department = department
        self.age_range = age_range
        self.base_sleep = round(base_sleep, 2)
        self.base_study = round(base_study, 2)
        self.base_stress = round(base_stress, 2)
        self.base_mood = round(base_mood, 2)
        self.base_screen = round(base_screen, 2)
        self.base_exercise = round(base_exercise, 1)
        self.base_social = round(base_social, 2)
        self.event_type = event_type
        self.event_start_day = event_start_day
        self.event_duration = event_duration

    def generate_day(self, day_idx: int) -> Dict[str, float]:
        """
        Generates the true underlying metrics for a given day (0-59),
        incorporating personal baseline, day-to-day noise, and injected events.
        """
        # Base values with natural Gaussian noise
        sleep = self.base_sleep + random.gauss(0, 0.35)
        study = self.base_study + random.gauss(0, 0.45)
        stress = self.base_stress + random.gauss(0, 0.30)
        mood = self.base_mood + random.gauss(0, 0.35)
        screen = self.base_screen + random.gauss(0, 0.50)
        exercise = self.base_exercise + random.gauss(0, 6.0)
        social = self.base_social + random.gauss(0, 0.35)

        # Apply event effects if active
        if self.event_type != "control" and self.event_start_day is not None:
            if self.event_type == "slow_drift":
                # Gradual sleep decline: falls ~15 min (0.25h) per week for 6 weeks
                if day_idx >= self.event_start_day:
                    weeks_in = (day_idx - self.event_start_day) / 7.0
                    drift_amount = min(1.5, weeks_in * 0.25)
                    sleep -= drift_amount
                    stress += min(1.2, weeks_in * 0.20)
                    mood -= min(1.0, weeks_in * 0.15)
            elif self.event_duration is not None:
                event_end = self.event_start_day + self.event_duration
                if self.event_start_day <= day_idx < event_end:
                    progress = (day_idx - self.event_start_day) / max(1, self.event_duration)
                    # Ramp up impact then stay elevated
                    ramp = min(1.0, progress * 2.5)

                    if self.event_type == "exam_stress":
                        study += 2.5 * ramp
                        sleep -= 1.8 * ramp
                        stress += 1.8 * ramp
                        mood -= 1.2 * ramp
                    elif self.event_type == "digital_binge":
                        screen += 3.5 * ramp
                        sleep -= 1.4 * ramp
                        exercise -= 20.0 * ramp
                        mood -= 0.8 * ramp
                    elif self.event_type == "social_withdrawal":
                        social -= 2.0 * ramp
                        mood -= 1.4 * ramp
                        stress += 1.4 * ramp

        # Clamp values to valid clinical / observational ranges
        sleep = max(3.0, min(12.0, round(sleep, 1)))
        study = max(0.5, min(14.0, round(study, 1)))
        stress = max(1, min(5, int(round(stress))))
        mood = max(1, min(5, int(round(mood))))
        screen = max(1.0, min(16.0, round(screen, 1)))
        exercise = max(0.0, min(120.0, round(exercise, 0)))
        social = max(1, min(5, int(round(social))))

        return {
            "mood": mood,
            "stress": stress,
            "sleep": sleep,
            "study": study,
            "screen": screen,
            "exercise": exercise,
            "social": social
        }


def create_demo_student_s001() -> StudentPersona:
    """
    Creates hand-crafted demo student S001 per Section 7.1:
    - 3 stable weeks (Days 0-20)
    - Gradual decline over weeks 4-6 (Days 21-41)
    - Triggers Academic workload pattern (study up, sleep down, stress up) + sleep drift
    """
    return StudentPersona(
        student_id="S001",
        year=2,
        department="Computer Science",
        age_range="20-22",
        base_sleep=7.6,
        base_study=3.5,
        base_stress=2.0,
        base_mood=4.2,
        base_screen=4.5,
        base_exercise=35.0,
        base_social=4.0,
        event_type="academic_decline",
        event_start_day=21,
        event_duration=28
    )


def generate_s001_day(day_idx: int) -> Dict[str, float]:
    """
    Hand-crafted day-by-day generator for demo student S001.
    Ensures precise mathematical alignment with CUSUM and pattern rule thresholds.
    """
    # Weeks 1 to 3 (Days 0 to 20): Stable healthy baseline
    if day_idx < 21:
        sleep = 7.6 + random.gauss(0, 0.25)
        study = 3.5 + random.gauss(0, 0.30)
        stress = 2 + random.choice([0, 0, 0, 1, -1])
        mood = 4 + random.choice([0, 0, 1, 0, -1])
        screen = 4.5 + random.gauss(0, 0.40)
        exercise = 35.0 + random.gauss(0, 4.0)
        social = 4 + random.choice([0, 0, 1, -1])

    # Week 4 (Days 21 to 27): Quiet sleep drift begins (study creeps up, sleep drifts)
    elif day_idx < 28:
        step = (day_idx - 21) / 7.0
        sleep = 7.6 - (0.8 + 0.5 * step) + random.gauss(0, 0.20)  # ~6.8 to 6.3 h
        study = 3.5 + (1.2 + 0.8 * step) + random.gauss(0, 0.30)  # ~4.7 to 5.5 h
        stress = 3 if day_idx < 25 else 4
        mood = 3 + random.choice([0, 0, -1])
        screen = 4.8 + random.gauss(0, 0.40)
        exercise = 25.0 + random.gauss(0, 4.0)
        social = 3

    # Week 5 (Days 28 to 34): Definite Academic workload pattern + CUSUM accumulator flags
    elif day_idx < 35:
        sleep = 5.5 + random.gauss(0, 0.25)   # z <= -1 clearly
        study = 6.2 + random.gauss(0, 0.35)   # z >= +1 clearly
        stress = 4 + random.choice([0, 1])    # z >= +1 clearly
        mood = 2 + random.choice([0, 1])
        screen = 5.5 + random.gauss(0, 0.40)
        exercise = 15.0 + random.gauss(0, 4.0)
        social = 2

    # Week 6 (Days 35 to 41): Peak workload pressure
    elif day_idx < 42:
        sleep = 4.9 + random.gauss(0, 0.25)
        study = 6.8 + random.gauss(0, 0.40)
        stress = 4 + random.choice([0, 1])
        mood = 2
        screen = 6.0 + random.gauss(0, 0.50)
        exercise = 10.0 + random.gauss(0, 3.0)
        social = 2

    # Weeks 7 to 8.5 (Days 42 to 59): Post-peak gradual adjustment
    else:
        sleep = 6.3 + random.gauss(0, 0.30)
        study = 5.0 + random.gauss(0, 0.40)
        stress = 3 + random.choice([0, 1, -1])
        mood = 3 + random.choice([0, 1])
        screen = 4.8 + random.gauss(0, 0.40)
        exercise = 22.0 + random.gauss(0, 4.0)
        social = 3

    # Clamping
    sleep = max(3.0, min(11.0, round(sleep, 1)))
    study = max(1.0, min(14.0, round(study, 1)))
    stress = max(1, min(5, int(stress)))
    mood = max(1, min(5, int(mood)))
    screen = max(1.0, min(14.0, round(screen, 1)))
    exercise = max(0.0, min(90.0, round(exercise, 0)))
    social = max(1, min(5, int(social)))

    return {
        "mood": mood,
        "stress": stress,
        "sleep": sleep,
        "study": study,
        "screen": screen,
        "exercise": exercise,
        "social": social
    }


def create_synthetic_cohort() -> List[StudentPersona]:
    """
    Creates 40 synthetic student personas with diverse baselines
    distributed across 5 event groups (8 students each):
    1. exam_stress (study up, sleep down, stress up)
    2. digital_binge (screen up, sleep down, exercise down)
    3. social_withdrawal (social down, mood down, stress up)
    4. slow_drift (sleep falls ~15 min/wk for 6 wks)
    5. control (stable with natural noise, for measuring false alarm rate)
    """
    personas = []
    # Seed for reproducibility
    rng = random.Random(42)

    event_configs = [
        ("exam_stress", 8),
        ("digital_binge", 8),
        ("social_withdrawal", 8),
        ("slow_drift", 8),
        ("control", 8)
    ]

    student_num = 2
    for event_type, count in event_configs:
        for _ in range(count):
            sid = f"S{student_num:03d}"
            year = rng.choice([1, 2, 3, 4])
            dept = rng.choice(DEPARTMENTS)
            age = rng.choice(AGE_RANGES)

            # Individual personal baselines
            base_sleep = rng.uniform(5.5, 8.5)
            base_stress = rng.uniform(1.3, 2.7)
            base_study = rng.uniform(1.5, 5.5)
            base_screen = rng.uniform(2.5, 7.5)
            base_exercise = rng.uniform(12.0, 50.0)
            base_social = rng.uniform(2.5, 4.5)
            base_mood = rng.uniform(3.2, 4.6)

            if event_type == "slow_drift":
                start_day = 14
                duration = 42
            elif event_type == "control":
                start_day = None
                duration = None
            else:
                start_day = rng.randint(25, 33)
                duration = rng.randint(12, 18)

            personas.append(
                StudentPersona(
                    student_id=sid,
                    year=year,
                    department=dept,
                    age_range=age,
                    base_sleep=base_sleep,
                    base_study=base_study,
                    base_stress=base_stress,
                    base_mood=base_mood,
                    base_screen=base_screen,
                    base_exercise=base_exercise,
                    base_social=base_social,
                    event_type=event_type,
                    event_start_day=start_day,
                    event_duration=duration
                )
            )
            student_num += 1

    return personas


def select_main_factor(metrics: Dict[str, float]) -> str:
    """
    Selects the primary contributing factor for today's checkin based on observed values.
    """
    if metrics["study"] >= 6.0 or metrics["stress"] >= 4:
        return "Studies"
    elif metrics["sleep"] <= 5.5:
        return "Sleep"
    elif metrics["screen"] >= 7.0:
        return "Screen"
    elif metrics["social"] <= 2:
        return "Social"
    elif metrics["mood"] >= 4:
        return "Personal"
    return "Routine"
