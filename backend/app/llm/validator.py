"""
Validator for LLM outputs in Drift.
Enforces:
1. Complete rejection of banned medical/clinical terminology.
2. Complete rejection of hallucinated numbers not present in the input JSON.
"""

import re
from typing import Dict, Any, List, Set, Tuple

# Banned terminology pattern per project rules
BANNED_WORDS_PATTERN = re.compile(
    r"\b(depression|depressed|anxiety|disorder|diagnos[a-z]*|mental\s+illness|bipolar|suicid[a-z]*)\b",
    re.IGNORECASE
)

NUMBER_PATTERN = re.compile(r"\b\d+(?:\.\d+)?\b")


def extract_numbers_from_obj(obj: Any) -> Set[float]:
    """Recursively extracts all numerical values (and their absolute values) from facts."""
    numbers = set()
    if isinstance(obj, (int, float)):
        val = float(obj)
        numbers.add(round(val, 2))
        numbers.add(round(abs(val), 2))
    elif isinstance(obj, str):
        for match in NUMBER_PATTERN.findall(obj):
            try:
                val = float(match)
                numbers.add(round(val, 2))
                numbers.add(round(abs(val), 2))
            except ValueError:
                pass
    elif isinstance(obj, dict):
        for v in obj.values():
            numbers.update(extract_numbers_from_obj(v))
    elif isinstance(obj, list):
        for item in obj:
            numbers.update(extract_numbers_from_obj(item))
    return numbers


def validate_llm_response(
    llm_output_text: str,
    input_json: Dict[str, Any]
) -> Tuple[bool, str]:
    """
    Validates an LLM-generated string against banned words and number hallucinations.
    
    Returns:
        (is_valid: bool, failure_reason: str)
    """
    # 1. Banned words check
    banned_match = BANNED_WORDS_PATTERN.search(llm_output_text)
    if banned_match:
        return False, f"Output contains banned term: '{banned_match.group(0)}'"

    # 2. Number hallucination check
    input_numbers = extract_numbers_from_obj(input_json)
    output_numbers = set()
    for match in NUMBER_PATTERN.findall(llm_output_text):
        try:
            output_numbers.add(round(float(match), 2))
        except ValueError:
            pass

    # Numbers 1, 2, 3, 4, 5 are allowed if they correspond to ordinal suggestions or standard 1-5 scales
    standard_exemptions = {1.0, 2.0, 3.0, 4.0, 5.0}

    for num in output_numbers:
        # Check if number matches any input number within ±0.15 rounding tolerance
        matches_input = any(abs(num - inp_num) <= 0.15 for inp_num in input_numbers)
        if not matches_input and num not in standard_exemptions:
            return False, f"Hallucinated number detected: {num} (not present in input facts)"

    return True, "Valid"
