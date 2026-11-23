# MediTriage — student MVP scaffold

A regional-language symptom-intake and care-routing prototype based on the team's Milestone 1 proposal.

## What is included
- React + Vite frontend
- Flask backend with `/api/health`, `/api/languages`, `/api/translate`, `/api/triage`, `/api/chat`
- Translation adapter with a small **demo-only exact-match dictionary** and optional IndicTrans2 adapter
- Triage engine that deliberately returns `review_required` until a qualified clinical reviewer approves and configures rules
- Basic tests and environment setup instructions

## Important safety boundary
This is an educational prototype, **not a medical device, diagnosis system, or clinically validated triage service**. The included code does not make clinical urgency decisions. Do not use it with real patients or for real care decisions. The default triage response is `review_required`. A qualified clinician must define, review, validate, and approve any clinical rules before they are enabled. Translation can change medical meaning; uncertain translations must be confirmed by a qualified person.

## Requirements
- Python 3.10–3.12 recommended for the backend
- Node.js 20+ recommended for the frontend
- Internet connection for downloading packages and (optionally) model weights

## 1. Run the backend

```bash
cd backend
python -m venv .venv

# macOS / Linux
source .venv/bin/activate

# Windows PowerShell
# .venv\Scripts\Activate.ps1

pip install -r requirements.txt
cp .env.example .env
python app.py
```

Backend runs at `http://127.0.0.1:5000`.

Test:
```bash
curl http://127.0.0.1:5000/api/health
```

## 2. Run the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

## 3. Translation modes

The default is `demo`, so the project runs without a large model. It translates only the exact demo phrases in `backend/translation/translator.py`. Unknown phrases return `translation_unavailable`; they are never silently passed off as translated.

To attempt IndicTrans2:
1. Read the official model and toolkit instructions first:
   - https://github.com/AI4Bharat/IndicTrans2
   - https://huggingface.co/ai4bharat/indictrans2-indic-en-dist-200M
2. Use a separate Python environment and follow the current official installation matrix. Model/toolkit versions change; don't blindly pin an old Transformers version.
3. Set `TRANSLATION_MODE=indictrans2` in `.env`.
4. Install the model dependencies in that same environment.
5. Test every selected language and medical phrase with bilingual/clinical reviewers.

The optional adapter expects:
- `transformers`
- `torch`
- `IndicTransToolkit`
- model weights available from Hugging Face

The model is loaded once when the backend starts. It may require substantial RAM/VRAM and can be slow on CPU. If loading fails, the app reports a translation error rather than pretending the translation succeeded.

## 4. Triage rules
`backend/triage/reviewed_rules.json` intentionally contains no enabled clinical rules. This is deliberate. Do not add medical rules based on guesses or internet snippets. A qualified clinician must author and approve rules, thresholds, negation/context handling, escalation behaviour, and test cases. Record reviewer, date, version, rationale, and validation evidence.

## 5. Team division from Milestone 1
- Daksh Rawat: backend coordination, classifier/rule-engine structure, backend integration.
- Swastik Thapliyal: translation integration and React/chat interface.
- Both: validation, documentation, testing, and review with faculty/clinical advisor.

## 6. Suggested next steps
1. Run the backend health check.
2. Run the frontend and send a demo message.
3. Test the demo translation phrases.
4. Add tests for empty, unsupported, mixed-language, negated, and ambiguous inputs.
5. Arrange qualified clinical review before enabling any urgency or specialist-routing logic.

## Project disclaimer
MediTriage provides educational symptom-intake workflow demonstrations only. It does not diagnose, prescribe, or replace professional medical assessment.
