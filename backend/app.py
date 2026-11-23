import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

from translation.translator import (
    TranslationError,
    translate_to_english,
    translate_text,
    supported_languages
)
from triage.engine import assess_symptoms

load_dotenv()

app = Flask(__name__)
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
CORS(app, resources={r"/api/*": {"origins": [x.strip() for x in origins]}})

DISCLAIMER = (
    "Educational prototype only. This is not a diagnosis or clinically validated "
    "triage advice. Do not use it to make real healthcare decisions."
)

@app.post("/api/translate-ui")
def translate_ui():
    data = request.get_json(silent=True) or {}

    language = str(data.get("language", "en")).strip().lower()
    texts = data.get("texts", [])

    valid_languages = {
        item["code"] for item in supported_languages()
    }

    if language not in valid_languages:
        return jsonify({"error": "Unsupported language."}), 400

    if not isinstance(texts, list) or not texts:
        return jsonify({"error": "Please provide a list of texts."}), 400

    if len(texts) > 100:
        return jsonify({"error": "Too many texts in one request."}), 400

    try:
        translations = []

        for item in texts:
            if not isinstance(item, str) or not item.strip():
                return jsonify({"error": "Every text must be a non-empty string."}), 400

            translated = translate_text(item, "en", language)
            translations.append(translated)

        return jsonify({
            "status": "ok",
            "language": language,
            "translations": translations
        })

    except TranslationError as exc:
        return jsonify({
            "status": "translation_unavailable",
            "error": str(exc)
        }), 422

@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "project": "MediTriage"})

@app.get("/api/languages")
def languages():
    return jsonify({"languages": supported_languages()})

@app.post("/api/translate")
def translate():
    data = request.get_json(silent=True) or {}
    symptoms = str(data.get("symptoms", "")).strip()
    language = str(data.get("language", "en")).strip().lower()
    if not symptoms:
        return jsonify({"error": "Please enter symptom text."}), 400
    try:
        result = translate_to_english(symptoms, language)
        return jsonify(result)
    except TranslationError as exc:
        return jsonify({"status": "translation_unavailable", "error": str(exc)}), 422
    except Exception:
        app.logger.exception("Unexpected translation failure")
        return jsonify({"status": "translation_error", "error": "Translation failed. Please seek human review."}), 500

@app.post("/api/triage")
def triage():
    data = request.get_json(silent=True) or {}
    symptoms = str(data.get("symptoms", "")).strip()
    if not symptoms:
        return jsonify({"error": "Please enter symptom text."}), 400
    result = assess_symptoms(symptoms)
    result["disclaimer"] = DISCLAIMER
    return jsonify(result)

@app.post("/api/chat")
def chat():
    data = request.get_json(silent=True) or {}
    symptoms = str(data.get("symptoms", "")).strip()
    language = str(data.get("language", "en")).strip().lower()
    if not symptoms:
        return jsonify({"error": "Please enter symptom text."}), 400

    try:
        translation = translate_to_english(symptoms, language)
    except TranslationError as exc:
        return jsonify({
            "status": "translation_unavailable",
            "message": "The input could not be reliably translated. Human review is required.",
            "error": str(exc),
            "disclaimer": DISCLAIMER
        }), 422
    except Exception:
        app.logger.exception("Unexpected translation failure")
        return jsonify({
            "status": "translation_error",
            "message": "Translation failed. Human review is required.",
            "disclaimer": DISCLAIMER
        }), 500

    # No clinical rules are enabled in this student scaffold.
    triage_result = assess_symptoms(translation["translated_text"])
    return jsonify({
        "status": "ok",
        "original_text": symptoms,
        "input_language": language,
        "translation": translation,
        "triage": triage_result,
        "disclaimer": DISCLAIMER
    })

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.getenv("PORT", "5000")), debug=True)
