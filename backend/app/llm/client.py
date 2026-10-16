"""
LLM Client for Drift using Google Gemini API with seamless fallback.
Guarantees 100% demo uptime:
If GEMINI_API_KEY is missing, network is unavailable, or validator rejects the response,
it automatically falls back to deterministic Explanation Receipts.
"""

import os
import json
from typing import Dict, Any, Optional
from dotenv import load_dotenv

from app.llm.prompt import SYSTEM_PROMPT, build_user_prompt
from app.llm.validator import validate_llm_response
from app.llm.templates import generate_template_insight

# Load environment variables (.env)
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()


def generate_wellness_insight(facts: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generates an evidence-backed wellness reflection.
    Tries Gemini API first if configured; validates output against banned words and numbers.
    Falls back gracefully to deterministic templates if anything fails.
    """
    # If no API key is provided, use reliable template fallback
    if not GEMINI_API_KEY:
        fallback = generate_template_insight(facts)
        fallback["llm_status"] = "offline_fallback_no_key"
        return fallback

    # Attempt Gemini call
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)

        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=SYSTEM_PROMPT
        )

        user_content = build_user_prompt(facts)

        for attempt in range(2):
            response = model.generate_content(
                user_content,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0.2
                )
            )

            response_text = response.text.strip()
            # Validate output text against banned words and number hallucinations
            is_valid, reason = validate_llm_response(response_text, facts)

            if is_valid:
                try:
                    parsed = json.loads(response_text)
                    # Attach evidence receipts from template engine
                    template_fallback = generate_template_insight(facts)
                    parsed["receipts"] = template_fallback["receipts"]
                    parsed["source"] = "gemini_validated"
                    parsed["llm_status"] = "success"
                    return parsed
                except json.JSONDecodeError:
                    pass  # Retry or fallback
            else:
                # Retry once if rejected
                if attempt == 0:
                    user_content += f"\n\nPrevious attempt was rejected because: {reason}. Please strictly follow the number grounding rules."
                else:
                    break

    except Exception as e:
        # Graceful fallback on network error, quota exceeded, or library issues
        pass

    fallback = generate_template_insight(facts)
    fallback["llm_status"] = "offline_fallback_after_validation_or_network"
    return fallback
