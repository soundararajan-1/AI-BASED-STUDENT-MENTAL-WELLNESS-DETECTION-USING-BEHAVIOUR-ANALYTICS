"""
Prompt builder for Drift's Student Query feature ("Ask Drift").
Generates answers to student questions grounded in their own real behavioural data.
Same safety rules apply: no clinical words, no hallucinated numbers.
"""

import json
from typing import Dict, Any


# System prompt for the student-query mode (conversational but grounded)
QUERY_SYSTEM_PROMPT = """You are Drift, a friendly and supportive educational student wellness companion.
A student is asking you a personal question about their own wellness habits or routines.
You must answer ONLY using the numerical facts provided in the JSON context below.
Do NOT introduce any new numbers, claims, or facts not present in the context.

CRITICAL SAFETY RULES:
1. You are NOT a doctor, counsellor, or therapist. Never give medical advice.
2. BANNED WORDS — never use: depression, depressed, anxiety, disorder, diagnosis,
   diagnosed, mental illness, bipolar, suicide, suicidal, clinical, treatment, therapy.
   Use neutral phrasing: 'stress levels', 'sleep pattern', 'daily routine', 'mood trend',
   'wellness pattern', 'personal baseline', 'behavioural shift'.
3. GROUNDING: Only mention numbers from the provided JSON context.
   Do NOT invent or estimate numbers.
4. Keep the tone warm, encouraging, and specific to the student's own data.
5. If the question cannot be answered from the data (e.g. asks about something not tracked),
   say so honestly and suggest what data would help.
6. Output valid JSON only — no markdown, no code fences.
7. MULTILINGUAL & MULTI-DIALECT ADAPTATION: Detect the language and dialect of the student's question (e.g. English, Hindi, Hinglish, Spanish, French, Telugu, Tamil, German, Mandarin, etc.).
   Respond warmly and naturally in that SAME language and dialect. The JSON keys must remain in English ('answer', 'data_basis', 'suggestions', 'encouragement', 'disclaimer'), but their string values must be translated seamlessly into the student's chosen language.

JSON schema for your response:
{
  "answer": "A direct, helpful 2–4 sentence answer to the student's question, grounded in their data (in student's language).",
  "data_basis": "1 sentence explaining which metrics from their history you used (in student's language).",
  "suggestions": ["Practical tip 1 based on their data", "Practical tip 2"],
  "encouragement": "One short, warm closing sentence (in student's language).",
  "disclaimer": "This is a wellness pattern observation, not medical advice (in student's language)."
}
"""


def build_query_prompt(student_question: str, context: Dict[str, Any]) -> str:
    """
    Builds the full user-facing prompt for the Ask Drift feature.
    Combines the student's question with their anonymised behavioural context.
    """
    return (
        f"Student's question: \"{student_question}\"\n\n"
        "Their anonymised behavioural context (use ONLY these numbers in your answer):\n"
        f"{json.dumps(context, indent=2)}\n\n"
        "Answer the student's question using their data. Follow the JSON schema exactly."
    )


def build_query_context(dashboard_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extracts only the relevant, anonymised facts from the dashboard payload
    to send to the LLM. No student ID or free-text is included.
    """
    baselines = dashboard_data.get("baselines", {})
    what_changed = dashboard_data.get("what_changed", {}).get("changes", [])
    pattern = dashboard_data.get("pattern", {})
    drift = dashboard_data.get("drift", {})
    levers = dashboard_data.get("levers", {})
    confidence = dashboard_data.get("overall_confidence", 0)
    days_tracked = dashboard_data.get("total_days_tracked", 0)

    # Build a clean, compact metric summary (only median, recent, z-score)
    metric_summary = {}
    for metric, b in baselines.items():
        if b.get("median") is not None:
            metric_summary[metric] = {
                "personal_median": b.get("median"),
                "recent_value":    b.get("recent_value"),
                "z_score":         b.get("z"),              # deviation from their own norm
                "normal_band":     [b.get("band_low"), b.get("band_high")],
                "confidence_pct":  int((b.get("confidence") or 0) * 100)
            }

    # Top 3 changes sorted by size
    top_changes = [
        {
            "metric":    c.get("metric"),
            "direction": c.get("direction"),
            "delta":     c.get("delta"),
            "meaningful": c.get("meaningful", False)
        }
        for c in what_changed[:3]
    ]

    # Primary drift info
    primary_drift = drift.get("primary_drift") or {}
    drift_summary = {
        "has_drift":  primary_drift.get("has_drift", False),
        "metric":     primary_drift.get("metric"),
        "message":    primary_drift.get("message"),
    } if primary_drift else {"has_drift": False}

    # Personal levers if available
    lever_summary = {}
    if levers and levers.get("has_enough_data"):
        lever_summary = {
            "finding":    levers.get("finding"),
            "sleep_above_median_stress": levers.get("stress_after_good_sleep"),
            "sleep_below_median_stress": levers.get("stress_after_poor_sleep"),
        }

    return {
        "days_tracked":      days_tracked,
        "baseline_confidence_pct": int(confidence * 100),
        "metrics":           metric_summary,
        "top_changes":       top_changes,
        "detected_pattern":  pattern.get("primary_pattern", {}).get("name") if pattern.get("primary_pattern") else "No strong pattern detected",
        "drift":             drift_summary,
        "personal_levers":   lever_summary or "Not enough data yet (need 14+ days)",
    }
