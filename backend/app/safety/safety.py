"""
Rule-Based Safety Layer for Drift.
Provides deterministic support protocols without LLM involvement.
Evaluates Soft and Firm escalation triggers to offer supportive resources and campus contacts.

Notice: Educational wellness-support prototype, not a medical diagnostic tool.
Never uses clinical or diagnostic terminology.
"""

from typing import Dict, List, Any, Optional

COUNSELLOR_CONTACT = {
    "title": "Campus Student Wellness & Counselling Centre",
    "hours": "Mon-Fri 9:00 AM - 5:00 PM",
    "phone": "+1 (800) 273-TALK (or campus ext. 4357)",
    "email": "wellness-support@campus.edu",
    "location": "Student Services Building, Room 204",
    "helpline_24_7": "National Crisis & Support Line: Dial or text 988"
}


def evaluate_safety(
    recent_checkins: List[Dict[str, Any]],
    user_requested_help: bool = False
) -> Dict[str, Any]:
    """
    Evaluates the safety protocol based on the student's recent daily taps.
    
    Args:
        recent_checkins: list of dicts [{'date': str, 'mood': int, 'stress': int}],
                         ordered by date ascending (most recent is last).
        user_requested_help: True if student tapped 'I'd like to talk to someone' button.
        
    Returns:
        {
            "level": "none" | "soft" | "firm",
            "triggered": bool,
            "reason": str,
            "message": str,
            "counsellor_info": Dict,
            "skip_llm": bool
        }
    """
    if user_requested_help:
        return {
            "level": "firm",
            "triggered": True,
            "reason": "Direct student request for connection",
            "message": (
                "You reached out for support. You don't have to carry stressful moments on your own. "
                "Here are confidential campus resources and immediate helpline contacts available for you right now."
            ),
            "counsellor_info": COUNSELLOR_CONTACT,
            "skip_llm": True
        }

    if not recent_checkins:
        return {
            "level": "none",
            "triggered": False,
            "reason": "No check-ins available",
            "message": "",
            "counsellor_info": COUNSELLOR_CONTACT,
            "skip_llm": False
        }

    # Extract stress and mood sequences
    stresses = [c["stress"] for c in recent_checkins]
    moods = [c["mood"] for c in recent_checkins]

    # FIRM CHECK: stress = 5 AND mood = 1 on 2 consecutive days
    if len(recent_checkins) >= 2:
        last_two_stress = stresses[-2:]
        last_two_mood = moods[-2:]
        if last_two_stress == [5, 5] and last_two_mood == [1, 1]:
            return {
                "level": "firm",
                "triggered": True,
                "reason": "Consistently high stress and low mood over recent days",
                "message": (
                    "We noticed things have felt particularly heavy for you over the last couple of days. "
                    "Talking to someone who understands student life can really help ease the pressure. "
                    "Support is readily available on campus whenever you're ready."
                ),
                "counsellor_info": COUNSELLOR_CONTACT,
                "skip_llm": True
            }

    # SOFT CHECK 1: stress >= 4 on 3 of the last 4 days
    if len(stresses) >= 4:
        last_4_stress = stresses[-4:]
        if sum(1 for s in last_4_stress if s >= 4) >= 3:
            return {
                "level": "soft",
                "triggered": True,
                "reason": "Elevated stress across most recent days",
                "message": (
                    "It looks like this week has demanded a lot of energy and stress levels have been high. "
                    "Remember to take small breathing spaces, and feel free to connect with our campus wellness team if you'd like support."
                ),
                "counsellor_info": COUNSELLOR_CONTACT,
                "skip_llm": False
            }

    # SOFT CHECK 2: mood "Not good" (1) on 3 consecutive days
    if len(moods) >= 3:
        if moods[-3:] == [1, 1, 1]:
            return {
                "level": "soft",
                "triggered": True,
                "reason": "Lower reported mood over consecutive days",
                "message": (
                    "You've reported feeling lower than usual over the past few days. "
                    "Give yourself permission to pause, and know that you have confidential campus resources ready to listen."
                ),
                "counsellor_info": COUNSELLOR_CONTACT,
                "skip_llm": False
            }

    return {
        "level": "none",
        "triggered": False,
        "reason": "Within supportive boundaries",
        "message": "",
        "counsellor_info": COUNSELLOR_CONTACT,
        "skip_llm": False
    }
