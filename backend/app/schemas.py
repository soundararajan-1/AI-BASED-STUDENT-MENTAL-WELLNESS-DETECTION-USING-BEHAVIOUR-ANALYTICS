"""
Pydantic schemas for data validation and API payloads.
Uses modern Pydantic V2 ConfigDict.
"""

from typing import Optional, Dict, List, Any
from pydantic import BaseModel, Field, ConfigDict


class StudentCreate(BaseModel):
    student_id: str
    year: Optional[int] = None
    department: Optional[str] = None
    age_range: Optional[str] = None
    baseline_sleep: Optional[float] = 7.5
    baseline_study: Optional[float] = 3.5
    baseline_screen: Optional[float] = 4.0
    baseline_exercise: Optional[float] = 1.0
    baseline_social: Optional[float] = 3.0
    baseline_mood: Optional[float] = 4.0
    baseline_stress: Optional[float] = 2.0
    consent: bool = Field(default=False)


class StudentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    student_id: str
    year: Optional[int] = None
    department: Optional[str] = None
    age_range: Optional[str] = None
    baseline_sleep: Optional[float] = None
    baseline_study: Optional[float] = None
    baseline_screen: Optional[float] = None
    baseline_exercise: Optional[float] = None
    baseline_social: Optional[float] = None
    baseline_mood: Optional[float] = None
    baseline_stress: Optional[float] = None
    consent: int
    created_at: Optional[str] = None


class CheckinCreate(BaseModel):
    student_id: str
    date: Optional[str] = None
    mood: int = Field(ge=1, le=5, description="1 (Not good) to 5 (Good)")
    stress: int = Field(ge=1, le=5, description="1 (Low) to 5 (High)")
    main_factor: Optional[str] = None

    # Detailed behavioral metrics (optional in daily check-in, Section 9)
    sleep_hours: Optional[float] = Field(default=None, ge=0.0, le=24.0)
    study_hours: Optional[float] = Field(default=None, ge=0.0, le=24.0)
    screen_time: Optional[float] = Field(default=None, ge=0.0, le=24.0)
    exercise: Optional[float] = Field(default=None, ge=0.0, le=24.0)
    social_interaction: Optional[float] = Field(default=None, ge=1.0, le=5.0)
    academic_pressure: Optional[int] = Field(default=None, ge=1, le=5)

    # Micro-question support
    micro_key: Optional[str] = None
    micro_value: Optional[float] = None


class CheckinResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: str
    date: str
    mood: int
    stress: int
    main_factor: Optional[str] = None
    sleep_hours: Optional[float] = None
    study_hours: Optional[float] = None
    screen_time: Optional[float] = None
    exercise: Optional[float] = None
    social_interaction: Optional[float] = None
    academic_pressure: Optional[int] = None
    micro_key: Optional[str] = None
    micro_value: Optional[float] = None


class AdaptiveQuestionItem(BaseModel):
    question_id: int
    question: str
    trigger_reason: str
    answer: Optional[str] = None


class AdaptiveAnswerSubmit(BaseModel):
    student_id: str
    question_id: int
    answer: str


class PredictRequest(BaseModel):
    sleep_hours: float = Field(..., ge=0, le=24)
    study_hours: float = Field(..., ge=0, le=24)
    screen_time: float = Field(..., ge=0, le=24)
    exercise: float = Field(..., ge=0, le=24)
    social_interaction: float = Field(..., ge=1, le=5)
    mood: int = Field(..., ge=1, le=5)
    stress: int = Field(..., ge=1, le=5)
    academic_pressure: int = Field(..., ge=1, le=5)


class PredictResponse(BaseModel):
    wellness_category: str
    confidence: float
    probabilities: Dict[str, float]
    model: str
    features_used: Dict[str, Any]
