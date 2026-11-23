from triage.engine import assess_symptoms

def test_triage_requires_review_by_default():
    result = assess_symptoms("I have a fever")
    assert result["status"] == "review_required"
    assert result["urgency"] == "not_assessed"
