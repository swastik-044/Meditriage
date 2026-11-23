
import torch
from functools import lru_cache
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM


class TranslationError(Exception):
    pass


MODEL_NAME = "facebook/nllb-200-distilled-600M"

LANGUAGES = {
    "en": {"name": "English", "code": "eng_Latn"},
    "hi": {"name": "Hindi", "code": "hin_Deva"},
    "bn": {"name": "Bengali", "code": "ben_Beng"},
    "ta": {"name": "Tamil", "code": "tam_Taml"},
    "te": {"name": "Telugu", "code": "tel_Telu"},
    "mr": {"name": "Marathi", "code": "mar_Deva"},
    "gu": {"name": "Gujarati", "code": "guj_Gujr"},
}


def supported_languages():
    return [
        {"code": code, "name": details["name"]}
        for code, details in LANGUAGES.items()
    ]


@lru_cache(maxsize=1)
def load_model():
    device = "mps" if torch.backends.mps.is_available() else "cpu"

    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)

    model.to(device)
    model.eval()

    return tokenizer, model, device


def translate_text(text, source_language, target_language):
    text = str(text).strip()
    source_language = str(source_language).lower()
    target_language = str(target_language).lower()

    if not text:
        raise TranslationError("Text cannot be empty.")

    if source_language not in LANGUAGES:
        raise TranslationError("Unsupported source language.")

    if target_language not in LANGUAGES:
        raise TranslationError("Unsupported target language.")

    if source_language == target_language:
        return text

    try:
        tokenizer, model, device = load_model()

        tokenizer.src_lang = LANGUAGES[source_language]["code"]

        inputs = tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=512
        ).to(device)

        target_code = LANGUAGES[target_language]["code"]
        target_language_id = tokenizer.convert_tokens_to_ids(target_code)

        with torch.inference_mode():
            translated_tokens = model.generate(
                **inputs,
                forced_bos_token_id=target_language_id,
                max_new_tokens=256
            )

        translated_text = tokenizer.batch_decode(
            translated_tokens,
            skip_special_tokens=True
        )[0]

        if not translated_text.strip():
            raise TranslationError("Translation returned empty text.")

        return translated_text

    except TranslationError:
        raise
    except Exception as exc:
        raise TranslationError("Translation could not be completed.") from exc


def translate_to_english(text, language="en"):
    translated = translate_text(text, language, "en")

    return {
        "status": "ok",
        "translated_text": translated,
        "source_language": language,
        "method": "nllb_local"
    }
