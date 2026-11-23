import json
from pathlib import Path

RULES_PATH = Path(__file__).with_name("reviewed_rules.json")

def assess_symptoms(translated_text):
    """
    Safe default for a student prototype.
    No clinical urgency or specialist rules are enabled.
    Do not replace this with guessed keyword rules.
    """
    try:
        config = json.loads(RULES_PATH.read_text(encoding="utf-8"))
    except Exception:
        config = {"clinical_rules_enabled": False}

    if not config.get("clinical_rules_enabled") or not config.get("rules"):
        return {
            "status": "review_required",
            "urgency": "not_assessed",
            "specialist": None,
            "timeframe": None,
            "explanation": (
                "The prototype has no clinician-approved triage rules enabled. "
                "A qualified healthcare professional must review the symptoms."
            )
        }

    # Intentionally fail closed until a clinician-approved rule engine,
    # context/negation handling, and validation suite are implemented.
    return {
        "status": "review_required",
        "urgency": "not_assessed",
        "specialist": None,
        "timeframe": None,
        "explanation": (
            "Rules are present, but automated decisions are not implemented "
            "or clinically validated in this scaffold."
        )
    }
