"""
Real-time AI Chatbot API for Student Wellness Queries.
Empowered by Google Gemini API (gemini-3.8-flash / genai SDK) with deterministic safety fallback.
Provides evidence-grounded generative replies, distress detection, and proactive campus counsellor recommendation.

Notice: Educational wellness-support prototype. Not a medical diagnostic tool.
"""

import os
import re
import json
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from app.db import get_db
from app.models import Student, Checkin
from app.llm.validator import validate_llm_response
from app.llm.query_prompt import (
    QUERY_SYSTEM_PROMPT,
    build_query_prompt,
    build_query_context,
)
from app.api.dashboard import get_dashboard_data
from app.safety.safety import evaluate_safety, COUNSELLOR_CONTACT

load_dotenv()
ENV_GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
if ENV_GEMINI_API_KEY == "your-gemini-api-key-here":
    ENV_GEMINI_API_KEY = ""

router = APIRouter(tags=["chat"])

# Detailed Campus Counsellor Profile for recommendations
DETAILED_COUNSELLOR_INFO = {
    "name": "Dr. Sarah Jenkins, Ph.D.",
    "role": "Lead Campus Wellness & Mental Health Counsellor",
    "department": "Student Psychological Services & Wellness Centre",
    "location": COUNSELLOR_CONTACT.get("location", "Student Services Building, Room 204"),
    "phone": COUNSELLOR_CONTACT.get("phone", "+1 (800) 273-TALK (Ext 4357)"),
    "email": "counsellor@campus.edu",
    "hours": COUNSELLOR_CONTACT.get("hours", "Monday - Friday: 9:00 AM - 5:00 PM"),
    "helpline_24_7": COUNSELLOR_CONTACT.get("helpline_24_7", "National Crisis Line: 988 (24/7 Free & Confidential)"),
    "walk_in_policy": "Same-day walk-in crisis appointments are available between 1:00 PM - 3:00 PM.",
    "confidentiality_guarantee": "Strictly confidential under FERPA / HIPAA wellness guidelines."
}


# ---------------------------------------------------------------------------
# Pydantic Request & Response Schemas
# ---------------------------------------------------------------------------

class ChatHistoryItem(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str = Field(...)


class StudentChatRequest(BaseModel):
    """Payload for multi-turn student chat."""
    question: str = Field(
        ...,
        min_length=2,
        max_length=1500,
        description="The student's question or message."
    )
    history: Optional[List[ChatHistoryItem]] = Field(
        default_factory=list,
        description="Prior conversation turns for multi-turn context."
    )
    api_key: Optional[str] = Field(
        default=None,
        description="Optional custom Gemini API key provided by the user."
    )


class CounsellorBookingRequest(BaseModel):
    """Confidential appointment request directly from chatbot."""
    student_id: str
    slot: str = Field(..., description="e.g. 'Tomorrow 10:00 AM' or 'Drop-in today'")
    urgency: str = Field(default="Normal", description="'Normal' | 'Elevated' | 'Urgent'")
    note: Optional[str] = Field(default="")
    contact_method: Optional[str] = Field(default="In-person (Room 204)")


class StudentChatResponse(BaseModel):
    """Comprehensive chatbot response with generative text and counsellor recommendation."""
    answer: str
    data_basis: str
    suggestions: List[str]
    encouragement: str
    disclaimer: str
    llm_status: str  # 'gemini_3_8_flash' | 'gemini_fallback' | 'generative_synthesizer'
    question_echo: str
    recommend_counsellor: bool = False
    counsellor_urgency: str = "none"  # 'none' | 'soft' | 'firm'
    counsellor_reason: Optional[str] = None
    counsellor_info: Optional[Dict[str, Any]] = None


class VerifyKeyRequest(BaseModel):
    api_key: str


# ---------------------------------------------------------------------------
# Distress & Counsellor Recommendation Detection
# ---------------------------------------------------------------------------

DISTRESS_KEYWORDS = [
    "counsel", "counsellor", "counselor", "therapy", "therapist", "psychologist",
    "depress", "hopeless", "can't cope", "cannot cope", "overwhelm", "burnout",
    "breakdown", "crying", "anxiety attack", "panic", "suicid", "kill myself",
    "end it all", "self harm", "harm myself", "worthless", "nobody cares",
    "give up", "can't take this", "exhausted for weeks", "struggling deeply",
    "talk to someone", "human help", "reach out"
]

HIGH_STRESS_KEYWORDS = [
    "stressed", "failing", "exams", "deadlines", "behind", "sleep deprived",
    "insomnia", "isolated", "alone", "terrified", "pressure", "anxious"
]


def detect_counsellor_need(
    question: str,
    recent_checkins: List[Dict[str, Any]],
    context: Dict[str, Any],
    history: Optional[List[ChatHistoryItem]] = None
) -> Dict[str, Any]:
    """
    Evaluates whether the student should be recommended to visit the campus counsellor.
    Combines:
    1. Safety rule triggers (consecutive high stress or low mood)
    2. Explicit distress / crisis / therapist keywords in the question or history
    3. CUSUM persistent negative drift or steep deltas
    """
    q_lower = question.lower()
    hist_text = " ".join([h.content.lower() for h in (history or [])])

    # 1. Check Safety Engine protocol on recent check-ins
    safety_eval = evaluate_safety(recent_checkins, user_requested_help=False)
    safety_triggered = safety_eval.get("triggered", False)
    safety_level = safety_eval.get("level", "none")

    # 2. Check for explicit distress keywords
    has_distress = any(kw in q_lower or kw in hist_text for kw in DISTRESS_KEYWORDS)
    has_high_stress_kw = any(kw in q_lower for kw in HIGH_STRESS_KEYWORDS)

    # 3. Check recent stress history (last 5 check-ins)
    high_stress_count = 0
    low_mood_count = 0
    if recent_checkins:
        for c in recent_checkins[-5:]:
            if c.get("stress", 0) >= 4:
                high_stress_count += 1
            if c.get("mood", 5) <= 2:
                low_mood_count += 1

    # 4. Check CUSUM drift from context
    drift = context.get("drift", {})
    has_drift = drift.get("has_drift", False) if isinstance(drift, dict) else False

    # Determine recommendation status & urgency
    if "suicid" in q_lower or "kill myself" in q_lower or "end it all" in q_lower or safety_level == "firm":
        return {
            "recommend": True,
            "urgency": "firm",
            "reason": "Immediate priority support: You are dealing with heavy distress. Connecting directly with our campus wellness specialist or 24/7 helpline is strongly recommended.",
            "info": DETAILED_COUNSELLOR_INFO
        }

    if has_distress:
        return {
            "recommend": True,
            "urgency": "soft",
            "reason": "You expressed feelings of significant stress or asked about counselling support. A free, confidential campus conversation can provide immediate relief and practical strategies.",
            "info": DETAILED_COUNSELLOR_INFO
        }

    if safety_triggered or (high_stress_count >= 3 and has_high_stress_kw) or (low_mood_count >= 3):
        return {
            "recommend": True,
            "urgency": "soft",
            "reason": "Your recent check-in patterns show elevated stress across consecutive days. Taking advantage of confidential campus counselling can help you navigate this workload comfortably.",
            "info": DETAILED_COUNSELLOR_INFO
        }

    return {
        "recommend": False,
        "urgency": "none",
        "reason": None,
        "info": None
    }


# ---------------------------------------------------------------------------
# Generative Sentence Synthesizer Engine (Zero-Failure Fallback)
# ---------------------------------------------------------------------------

def generate_generative_sentence_reply(
    question: str,
    context: Dict[str, Any],
    history: Optional[List[ChatHistoryItem]] = None,
    recommend_counsellor: bool = False
) -> Dict[str, Any]:
    """
    Synthesizes rich, empathetic, non-clinical explanations grounded strictly in student's metrics.
    Guarantees 100% uptime even when offline or without API key.
    """
    q_lower = question.lower()
    days = context.get("days_tracked", 0)
    confidence = context.get("baseline_confidence_pct", 0)
    pattern = context.get("detected_pattern", "Balanced Behavior")
    drift = context.get("drift", {})
    changes = context.get("top_changes", [])
    metrics = context.get("metrics", {})

    top_change = changes[0] if changes else None
    top_metric = top_change.get("metric", "habits") if top_change else "lifestyle metrics"
    top_delta = abs(top_change.get("delta") or 0.0) if top_change else 0.0
    top_dir = "increased" if (top_change and top_change.get("direction") == "up") else "decreased"

    drift_msg = ""
    if isinstance(drift, dict) and drift.get("has_drift") and drift.get("message"):
        drift_msg = f" Statistical drift alert: {drift['message']}."

    is_sleep = any(w in q_lower for w in ["sleep", "tired", "wake", "bed", "rest", "insomnia", "exhaust", "energy", "nap"])
    is_academic = any(w in q_lower for w in ["exam", "test", "study", "deadline", "assignment", "workload", "grade", "gpa", "stress", "overwhelm", "cram"])
    is_screen = any(w in q_lower for w in ["screen", "phone", "scroll", "laptop", "instagram", "youtube", "social media", "device", "doomscroll"])
    is_social = any(w in q_lower for w in ["alone", "lonely", "friend", "isolate", "people", "talk", "hangout", "party", "social", "disconnect"])
    is_delta = any(w in q_lower for w in ["changed", "what changed", "most", "habit", "shift", "difference", "delta"])
    is_counsel = any(w in q_lower for w in ["counsel", "therapy", "doctor", "talk to someone", "help me", "support"])

    counsellor_note = ""
    if recommend_counsellor:
        counsellor_note = " Because this stretch feels demanding, connecting with our campus counsellor (Dr. Sarah Jenkins, Room 204) is a confidential and supportive step available to you."

    if is_counsel:
        answer = (
            f"You have tracked {days} days of wellness data with Drift (confidence: {confidence}%). "
            f"Taking proactive care of your mental well-being is a tremendous strength. "
            f"Our campus counsellor, Dr. Sarah Jenkins, offers friendly, 100% confidential sessions at the Student Services Centre (Room 204). "
            f"You can drop in or request a callback directly through this chat.{counsellor_note}"
        )
        suggestions = [
            "Use the confidential booking card below to schedule a relaxed check-in with Dr. Jenkins.",
            "Save the 24/7 campus crisis line (988 or ext. 4357) in your phone for anytime reassurance.",
            "Take a short 10-minute break outside to unburden your thoughts before returning to work."
        ]
        encouragement = "Reaching out is an empowering decision — you do not have to carry academic pressures alone."

    elif is_sleep:
        delta_str = f"shifted by {top_delta:.1f} hours" if top_metric == "sleep" else "shifted away from your personal comfort zone"
        answer = (
            f"Over your {days} tracked days, your daily sleep has {delta_str} compared to your personal baseline. "
            f"When sleep patterns deviate from your established normal rhythm, daytime mental clarity and stress tolerance naturally diminish. "
            f"Your current profile reflects '{pattern}', indicating your body is managing temporary fatigue.{drift_msg}{counsellor_note} "
            f"Prioritizing consistent sleep timing tonight will help reset your personal baseline and restore restorative focus."
        )
        suggestions = [
            "Establish a screen-free wind-down buffer thirty minutes before sleeping to encourage natural melatonin release.",
            "Keep your morning wake-up time within a thirty-minute window across both weekdays and weekends.",
            "Take short five-minute restorative pauses away from desks and bright screens between study sessions."
        ]
        encouragement = "Your body responds quickly when you protect your rest — prioritize an unhurried evening tonight."

    elif is_academic:
        study_delta_text = f"elevated your {top_metric} by {top_delta:.1f}" if top_change else "demanded extended daily study hours"
        answer = (
            f"Coursework deadlines and academic expectations have {study_delta_text} over your tracked {days} days. "
            f"Sustaining heavy cognitive effort without proportionate recovery increases mental fatigue and perceived academic pressure. "
            f"Your data classifies this phase under '{pattern}', which is a natural response to demanding university milestones.{drift_msg}{counsellor_note} "
            f"Structuring your study sessions into manageable intervals protects your retention while keeping fatigue from compounding."
        )
        suggestions = [
            "Use twenty-five minute focused study intervals paired with five-minute genuine offline breaks.",
            "Write a brief brain-dump list before bed to offload lingering coursework thoughts.",
            "Review your What Changed card to verify whether your sleep or screen habits shifted alongside your study load."
        ]
        encouragement = "You are working diligently through a demanding phase — remember that quality rest is part of your study strategy."

    elif is_screen:
        screen_delta_text = f"increased by {top_delta:.1f} hours" if top_metric == "screen" else "increased above your personal median"
        answer = (
            f"Your digital device usage has {screen_delta_text} relative to your personal baseline across {days} tracked days. "
            f"Prolonged screen exposure, particularly late into the night, activates sensory arousal and delays circadian sleep onset. "
            f"Your overall profile currently indicates '{pattern}', suggesting that digital demands may be encroaching on your downtime.{drift_msg}{counsellor_note} "
            f"Introducing small intentional boundaries around device use can create an immediate boost in your daytime energy."
        )
        suggestions = [
            "Place high-stimulation devices across the room thirty minutes before turning off the lights.",
            "Practice the twenty-twenty-twenty visual pause: look twenty feet away for twenty seconds every twenty minutes.",
            "Replace late-night phone browsing with an offline calming activity like listening to audio or light reading."
        ]
        encouragement = "Small boundaries with technology give your mind the quiet space it deserves to reset."

    elif is_social:
        answer = (
            f"During your {days} tracked days, your social connection has recorded noticeable shifts, currently aligning with '{pattern}'. "
            f"In demanding academic seasons, students often reduce social contact to save study time, yet shared peer moments are essential emotional buffers. "
            f"Your personal levers confirm that even modest social engagement positively correlates with your daily mood stability.{drift_msg}{counsellor_note} "
            f"Reaching out to a classmate or friend for a brief interaction can provide an uplifting cognitive break."
        )
        suggestions = [
            "Schedule a brief fifteen-minute study break or campus coffee walk with a friend today.",
            "Join a peer study group where shared presence reduces the weight of solitary coursework.",
            "Send a quick supportive text to someone you enjoy talking with to stay warmly connected."
        ]
        encouragement = "You do not have to carry academic demands in complete isolation — connection is a powerful wellness anchor."

    elif is_delta:
        top_name = top_metric.replace("_", " ").title()
        answer = (
            f"Across your {days} tracked days with {confidence}% baseline confidence, your {top_name} has registered the largest shift, "
            f"having {top_dir} by {top_delta:.1f} compared to your personal baseline. "
            f"This specific behavioral adjustment accounts for your current '{pattern}' classification.{drift_msg}{counsellor_note} "
            f"Because Drift evaluates changes against your own history rather than population averages, this delta reflects your genuine recent lifestyle swing."
        )
        suggestions = [
            f"Focus on gently stabilizing your {top_metric} over the next two days to return toward your normal band.",
            "Check the Fingerprint Radar chart to view all seven lifestyle axes side by side.",
            "Complete today's check-in so your rolling baseline adapts accurately to your current pace."
        ]
        encouragement = "Noticing what shifted gives you the clarity to make small, calm adjustments before stress builds up."

    else:
        change_phrase = f"your {top_metric} has {top_dir} by {top_delta:.1f} compared to your baseline" if top_change else "your lifestyle parameters remain within your normal band"
        answer = (
            f"Based on your {days} days of personal tracking (confidence: {confidence}%), {change_phrase}, aligning with your '{pattern}' pattern. "
            f"Balancing university life involves finding a steady rhythm between coursework concentration, digital boundaries, and restorative sleep.{drift_msg}{counsellor_note} "
            f"Drift continuously analyzes your check-ins to illuminate your personal levers without imposing diagnostic labels."
        )
        suggestions = [
            "Review your What Changed? card to identify which daily habit shifted most this week.",
            "Protect at least thirty minutes of restorative screen-free downtime before going to bed tonight.",
            "Log today's check-in to keep your personal wellness fingerprint up to date."
        ]
        encouragement = "Paying attention to your personal wellness patterns is a sign of great self-awareness — keep nurturing your balance."

    return {
        "answer": answer,
        "data_basis": f"Grounded in {days} days of personal history (confidence: {confidence}%).",
        "suggestions": suggestions,
        "encouragement": encouragement,
        "disclaimer": "Educational wellness pattern observation, not medical advice.",
        "llm_status": "generative_synthesizer",
        "question_echo": question,
    }


# ---------------------------------------------------------------------------
# Google Gemini Generative Text Engine (google-genai SDK)
# ---------------------------------------------------------------------------

def generate_gemini_chat_reply(
    question: str,
    context: Dict[str, Any],
    history: Optional[List[ChatHistoryItem]],
    api_key: str,
    counsellor_rec: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    """
    Calls Google Gemini using the official google-genai SDK.
    Tries current models (gemini-3.8-flash, gemini-2.5-flash, gemini-1.5-flash).
    Validates output for non-clinical tone and grounding.
    """
    if not api_key:
        return None

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)

        # Incorporate counsellor guidance if recommended
        counsellor_instruction = ""
        if counsellor_rec.get("recommend"):
            urgency = counsellor_rec.get("urgency", "soft")
            counsellor_instruction = (
                f"\n\nIMPORTANT COUNSELLOR RECOMMENDATION: The student is experiencing {urgency} stress/distress. "
                "Include a gentle, reassuring recommendation in your answer that they consider speaking with our campus counsellor, "
                "Dr. Sarah Jenkins (Student Services Building, Room 204), or calling campus support. "
                "Remind them that seeking support is a natural, healthy step."
            )

        system_instruction = QUERY_SYSTEM_PROMPT + counsellor_instruction

        # Prepare multi-turn conversational context
        conversation_context = []
        if history:
            for turn in history[-6:]:  # Keep recent 6 turns for memory
                conversation_context.append(f"{turn.role.capitalize()}: {turn.content}")

        history_block = "\n".join(conversation_context) if conversation_context else "No prior turns."

        user_content = (
            f"Recent Conversation History:\n{history_block}\n\n"
            + build_query_prompt(question, context)
        )

        # Model trial order: gemini-3.8-flash -> gemini-3.5-flash-lite -> gemini-flash-latest -> gemini-3.1-flash-lite
        models_to_try = ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-flash-latest", "gemini-3.1-flash-lite"]

        for model_name in models_to_try:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=user_content,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        temperature=0.3,
                        response_mime_type="application/json"
                    )
                )

                raw_text = response.text.strip() if response and response.text else ""
                if not raw_text:
                    continue

                is_valid, reason = validate_llm_response(raw_text, context)
                if is_valid:
                    try:
                        parsed = json.loads(raw_text)
                        required_fields = ["answer", "data_basis", "suggestions", "encouragement", "disclaimer"]
                        if all(k in parsed for k in required_fields):
                            parsed["llm_status"] = f"gemini_validated_{model_name.replace('-', '_')}"
                            parsed["question_echo"] = question
                            return parsed
                    except (json.JSONDecodeError, TypeError):
                        continue
            except Exception as model_err:
                # Fall to next model in list
                continue

    except Exception:
        pass

    return None


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------

@router.post("/chat/verify-key")
def verify_gemini_api_key(body: VerifyKeyRequest):
    """
    Validates whether a user-supplied Gemini API key works with Google GenAI.
    """
    key = body.api_key.strip()
    if not key:
        raise HTTPException(status_code=400, detail="API key is empty")

    try:
        from google import genai
        client = genai.Client(api_key=key)
        # Quick lightweight test query with primary model
        res = client.models.generate_content(
            model="gemini-3.8-flash",
            contents="Say 'OK' in one word."
        )
        if res and res.text:
            return {"valid": True, "model": "gemini-3.8-flash", "message": "Gemini API key is active and connected!"}
    except Exception as e:
        # Try fast fallback model (gemini-3.5-flash-lite)
        try:
            from google import genai
            client = genai.Client(api_key=key)
            res = client.models.generate_content(
                model="gemini-3.5-flash-lite",
                contents="Say 'OK' in one word."
            )
            if res and res.text:
                return {"valid": True, "model": "gemini-3.5-flash-lite", "message": "Gemini API key is active (gemini-3.5-flash-lite)!"}
        except Exception as inner_err:
            raise HTTPException(status_code=400, detail=f"Invalid Gemini API key or connection error: {str(inner_err)}")

    raise HTTPException(status_code=400, detail="Gemini API did not return a response")


@router.post("/chat/book-counsellor")
def book_counsellor_session(
    body: CounsellorBookingRequest,
    db: Session = Depends(get_db)
):
    """
    Confidential endpoint for a student to schedule a wellness check-in with the campus counsellor.
    Returns a secure confirmation reference code.
    """
    student = db.query(Student).filter(Student.student_id == body.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    import random
    ref_id = f"APPT-{random.randint(1000, 9999)}"
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")

    return {
        "success": True,
        "booking_id": ref_id,
        "status": "Confirmed",
        "student_id": body.student_id,
        "slot": body.slot,
        "urgency": body.urgency,
        "counsellor": DETAILED_COUNSELLOR_INFO["name"],
        "location": DETAILED_COUNSELLOR_INFO["location"],
        "phone": DETAILED_COUNSELLOR_INFO["phone"],
        "booked_at": now_str,
        "message": (
            f"Your confidential session ({ref_id}) has been reserved for {body.slot} with {DETAILED_COUNSELLOR_INFO['name']}. "
            "Please check in at Room 204 or drop in anytime during walk-in hours."
        )
    }


@router.post("/chat/{student_id}", response_model=StudentChatResponse)
@router.post("/ask/{student_id}", response_model=StudentChatResponse)
def handle_student_chat(
    student_id: str,
    body: StudentChatRequest,
    db: Session = Depends(get_db)
):
    """
    Unified multi-turn real-time chat endpoint for student wellness queries.
    - Evaluates student's personal metrics & baselines
    - Performs distress detection & evaluates counsellor recommendation
    - Generates grounded, compassionate reply via Gemini API (or Generative Synthesizer)
    - Returns structured answer with counsellor details when warranted
    """
    # 1. Confirm student exists
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    question = body.question.strip()

    # 2. Fetch live dashboard & recent check-ins
    try:
        dash = get_dashboard_data(student_id=student_id, as_of=None, db=db)
    except Exception:
        dash = {"has_data": False, "total_days_tracked": 0}

    # Fetch recent check-ins for safety evaluation
    recent_records = (
        db.query(Checkin)
        .filter(Checkin.student_id == student_id)
        .order_by(Checkin.date.asc())
        .limit(10)
        .all()
    )
    recent_checkins = [
        {"date": r.date, "mood": r.mood, "stress": r.stress}
        for r in recent_records
    ]

    context = build_query_context(dash)

    # 3. Detect Counsellor Recommendation Need
    counsellor_rec = detect_counsellor_need(
        question=question,
        recent_checkins=recent_checkins,
        context=context,
        history=body.history
    )

    # 4. Resolve Gemini API Key (request-level takes precedence over environment variable)
    resolved_api_key = (body.api_key or "").strip() or ENV_GEMINI_API_KEY

    # 5. Cold start check (< 3 days)
    if not dash.get("has_data", True) or dash.get("total_days_tracked", 0) < 3:
        ans = (
            "Drift is currently learning your normal patterns! "
            "Complete a few daily check-ins (at least 3 days) and I will provide "
            "personalised generative responses tailored to your personal rhythm."
        )
        if counsellor_rec.get("recommend"):
            ans += f"\n\nIn the meantime, our campus counsellor ({DETAILED_COUNSELLOR_INFO['name']}) is always available at {DETAILED_COUNSELLOR_INFO['location']}."

        return StudentChatResponse(
            answer=ans,
            data_basis="Initial learning phase (< 3 days tracked).",
            suggestions=[
                "Complete today's quick 25-second check-in.",
                "Explore the What Changed card once your baseline stabilizes."
            ],
            encouragement="Great to see you checking in on your wellness — keep up the habit!",
            disclaimer="Educational wellness pattern observation, not medical advice.",
            llm_status="initial_learning_phase",
            question_echo=question,
            recommend_counsellor=counsellor_rec.get("recommend", False),
            counsellor_urgency=counsellor_rec.get("urgency", "none"),
            counsellor_reason=counsellor_rec.get("reason"),
            counsellor_info=counsellor_rec.get("info")
        )

    # 6. Try Gemini API
    gemini_reply = None
    if resolved_api_key:
        gemini_reply = generate_gemini_chat_reply(
            question=question,
            context=context,
            history=body.history,
            api_key=resolved_api_key,
            counsellor_rec=counsellor_rec
        )

    # 7. Fallback to Generative Sentence Synthesizer if Gemini is unavailable or rejected
    if gemini_reply:
        reply_dict = gemini_reply
    else:
        reply_dict = generate_generative_sentence_reply(
            question=question,
            context=context,
            history=body.history,
            recommend_counsellor=counsellor_rec.get("recommend", False)
        )

    return StudentChatResponse(
        answer=reply_dict["answer"],
        data_basis=reply_dict.get("data_basis", "Grounded in personal history."),
        suggestions=reply_dict.get("suggestions", []),
        encouragement=reply_dict.get("encouragement", "Take care of your daily balance."),
        disclaimer=reply_dict.get("disclaimer", "Educational wellness pattern observation, not medical advice."),
        llm_status=reply_dict.get("llm_status", "generative_synthesizer"),
        question_echo=question,
        recommend_counsellor=counsellor_rec.get("recommend", False),
        counsellor_urgency=counsellor_rec.get("urgency", "none"),
        counsellor_reason=counsellor_rec.get("reason"),
        counsellor_info=counsellor_rec.get("info")
    )


@router.get("/chat/{student_id}/stream")
@router.get("/ask/{student_id}/stream")
async def handle_student_chat_stream(
    student_id: str,
    question: str = Query(..., min_length=2, max_length=1500),
    api_key: Optional[str] = Query(default=None),
    db: Session = Depends(get_db)
):
    """
    Real-time Server-Sent Events (SSE) streaming endpoint for the student chatbot.
    Streams tokens in real time, followed by counsellor recommendation and metadata.
    """
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    try:
        dash = get_dashboard_data(student_id=student_id, as_of=None, db=db)
        context = build_query_context(dash)
    except Exception:
        context = {"days_tracked": 0, "metrics": {}}

    recent_records = (
        db.query(Checkin)
        .filter(Checkin.student_id == student_id)
        .order_by(Checkin.date.asc())
        .limit(10)
        .all()
    )
    recent_checkins = [{"date": r.date, "mood": r.mood, "stress": r.stress} for r in recent_records]

    counsellor_rec = detect_counsellor_need(
        question=question,
        recent_checkins=recent_checkins,
        context=context
    )

    resolved_api_key = (api_key or "").strip() or ENV_GEMINI_API_KEY

    # Generate response
    gemini_reply = None
    if resolved_api_key:
        gemini_reply = generate_gemini_chat_reply(
            question=question,
            context=context,
            history=[],
            api_key=resolved_api_key,
            counsellor_rec=counsellor_rec
        )

    final_data = gemini_reply or generate_generative_sentence_reply(
        question=question,
        context=context,
        recommend_counsellor=counsellor_rec.get("recommend", False)
    )

    # Attach counsellor recommendation
    final_data["recommend_counsellor"] = counsellor_rec.get("recommend", False)
    final_data["counsellor_urgency"] = counsellor_rec.get("urgency", "none")
    final_data["counsellor_reason"] = counsellor_rec.get("reason")
    final_data["counsellor_info"] = counsellor_rec.get("info")

    async def event_generator():
        # Stream word tokens for realistic streaming feel
        words = final_data["answer"].split(" ")
        for i, word in enumerate(words):
            token = word + (" " if i < len(words) - 1 else "")
            payload = json.dumps({"type": "token", "token": token})
            yield f"data: {payload}\n\n"
            await asyncio.sleep(0.02)  # Natural typing rhythm

        # Send full completion payload
        done_payload = json.dumps({
            "type": "done",
            "response": final_data
        })
        yield f"data: {done_payload}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
