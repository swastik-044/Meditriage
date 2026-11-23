import pytest
from translation.translator import translate_to_english, TranslationError

def test_english_passthrough(monkeypatch):
    monkeypatch.setenv("TRANSLATION_MODE", "demo")
    result = translate_to_english("I have a fever", "en")
    assert result["translated_text"] == "I have a fever"
    assert result["method"] == "identity"

def test_demo_hindi_exact_match(monkeypatch):
    monkeypatch.setenv("TRANSLATION_MODE", "demo")
    result = translate_to_english("मुझे बुखार है", "hi")
    assert result["translated_text"] == "I have a fever."

def test_unknown_demo_phrase_fails_closed(monkeypatch):
    monkeypatch.setenv("TRANSLATION_MODE", "demo")
    with pytest.raises(TranslationError):
        translate_to_english("एक नया वाक्य", "hi")
