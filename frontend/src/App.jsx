
import React, { useEffect, useState } from "react";
import "./style.css";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

// All questions are originally written in English.
// The backend translates them into the patient's selected language.
const QUESTIONS = [
  {
    id: "symptom",
    prompt: "What problem are you experiencing?",
    options: [
      "Fever",
      "Headache",
      "Chest pain",
      "Stomach pain",
      "Cough",
      "Breathing difficulty",
      "Other"
    ]
  },
  {
    id: "location",
    prompt: "Where are you experiencing the problem?",
    options: [
      "Head",
      "Chest",
      "Upper stomach",
      "Lower stomach",
      "Throat",
      "Whole body",
      "Other"
    ]
  },
  {
    id: "duration",
    prompt: "How long have you been experiencing this problem?",
    options: [
      "Started today",
      "1–2 days",
      "3–7 days",
      "More than a week",
      "Not sure"
    ]
  },
  {
    id: "severity",
    prompt: "How severe is your pain or discomfort, from 1 to 10?",
    options: [
      "1", "2", "3", "4", "5",
      "6", "7", "8", "9", "10",
      "I have no pain"
    ]
  },
  {
    id: "otherSymptoms",
    prompt: "Are you experiencing any other symptoms?",
    options: [
      "None",
      "Dizziness",
      "Vomiting",
      "Fever",
      "Difficulty breathing",
      "Fainting",
      "Other"
    ]
  }
];

const EMERGENCY_MESSAGE =
  "Chest pain or difficulty breathing can be signs of a medical emergency. Seek immediate medical help. Do not wait to complete this questionnaire. In India, call 112 for emergency assistance.";

function getAllTexts() {
  return [
    ...QUESTIONS.flatMap(question => [
      question.prompt,
      ...question.options
    ]),
    EMERGENCY_MESSAGE
  ];
}

function buildTranslatedQuestions(translations) {
  let index = 0;

  const questions = QUESTIONS.map(question => {
    const prompt = translations[index++];
    const options = question.options.map(() => translations[index++]);

    return {
      ...question,
      prompt,
      options
    };
  });

  return {
    questions,
    emergencyMessage: translations[index]
  };
}

export default function App() {
  const [languages, setLanguages] = useState([
    { code: "en", name: "English" },
    { code: "hi", name: "Hindi" }
  ]);

  const [language, setLanguage] = useState("hi");
  const [questions, setQuestions] = useState([]);
  const [emergencyMessage, setEmergencyMessage] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loadingTranslations, setLoadingTranslations] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/api/languages`)
      .then(response => {
        if (!response.ok) throw new Error("Could not load languages");
        return response.json();
      })
      .then(data => setLanguages(data.languages))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadQuestions() {
      setLoadingTranslations(true);
      setQuestions([]);
      setQuestionIndex(0);
      setAnswers({});
      setResult(null);
      setError("");

      try {
        const response = await fetch(`${API}/api/translate-ui`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language,
            texts: getAllTexts()
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Question translation failed");
        }

        if (!cancelled) {
          const translated = buildTranslatedQuestions(data.translations);
          setQuestions(translated.questions);
          setEmergencyMessage(translated.emergencyMessage);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoadingTranslations(false);
        }
      }
    }

    loadQuestions();

    return () => {
      cancelled = true;
    };
  }, [language]);

  const currentQuestion = questions[questionIndex];

  function selectAnswer(option) {
    setAnswers(previous => ({
      ...previous,
      [currentQuestion.id]: option
    }));
  }

  function nextQuestion() {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(index => index + 1);
    }
  }

  function previousQuestion() {
    if (questionIndex > 0) {
      setQuestionIndex(index => index - 1);
    }
  }

  async function submitAnswers() {
    setSubmitting(true);
    setError("");

    const report = questions.map(question => {
      return `${question.prompt}: ${answers[question.id]}`;
    }).join("\n");

    try {
      const response = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms: report,
          language
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Submission failed");
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedSymptom = answers.symptom;
  const emergencySelected =
    selectedSymptom === "Chest pain" ||
    selectedSymptom === "Breathing difficulty" ||
    answers.otherSymptoms === "Difficulty breathing" ||
    answers.otherSymptoms === "Fainting";

  return (
    <main className="page">
      <header className="topbar">
        <div className="brand-mark">M</div>
        <div>
          <strong>MediTriage</strong>
          <span>Multilingual symptom intake prototype</span>
        </div>
        <span className="prototype">STUDENT MVP</span>
      </header>

      <section className="hero">
        <p className="eyebrow">Patient symptom intake</p>
        <h1>Let's understand how you are feeling.</h1>
        <p className="sub">
          Select your language and answer a few questions.
          Your answers will be prepared for healthcare-professional review.
        </p>
      </section>

      <section className="panel">
        <label htmlFor="language">Choose your language</label>
        <select
          id="language"
          value={language}
          onChange={event => setLanguage(event.target.value)}
          disabled={submitting}
        >
          {languages.map(item => (
            <option key={item.code} value={item.code}>
              {item.name}
            </option>
          ))}
        </select>

        {loadingTranslations && (
          <p className="muted">Preparing questions in your language...</p>
        )}

        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}

        {!loadingTranslations && questions.length > 0 && !result && (
          <div className="conversation">
            <div className="progress">
              Question {questionIndex + 1} of {questions.length}
            </div>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${((questionIndex + 1) / questions.length) * 100}%`
                }}
              />
            </div>

            {emergencySelected && (
              <div className="urgency-warning" role="alert">
                <strong>Emergency warning</strong>
                <p>{emergencyMessage}</p>
              </div>
            )}

            <div className="question-bubble">
              <h2>{currentQuestion.prompt}</h2>
            </div>

            <p className="muted">Select one answer:</p>

            <div className="answer-options">
              {currentQuestion.options.map(option => (
                <button
                  type="button"
                  key={option}
                  className={
                    answers[currentQuestion.id] === option
                      ? "answer-option selected"
                      : "answer-option"
                  }
                  onClick={() => selectAnswer(option)}
                >
                  <span>{option}</span>
                  {answers[currentQuestion.id] === option && (
                    <span>✓</span>
                  )}
                </button>
              ))}
            </div>

            <div className="conversation-controls">
              <button
                type="button"
                className="secondary-button"
                onClick={previousQuestion}
                disabled={questionIndex === 0}
              >
                Back
              </button>

              {questionIndex < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={nextQuestion}
                  disabled={!answers[currentQuestion.id]}
                >
                  Next question
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submitAnswers}
                  disabled={!answers[currentQuestion.id] || submitting}
                >
                  {submitting ? "Preparing report..." : "Submit answers"}
                </button>
              )}
            </div>
          </div>
        )}

        {result && (
          <div className="result">
            <h2>Intake report</h2>

            {result.translation && (
              <>
                <p className="muted">English report for healthcare review</p>
                <p className="translated">
                  {result.translation.translated_text}
                </p>
              </>
            )}

            <div className="status">
              <span>Review status</span>
              <strong>
                {result.triage?.status?.replaceAll("_", " ") || "Review required"}
              </strong>
            </div>

            <p>
              {result.triage?.explanation ||
                "A qualified healthcare professional must review the answers."}
            </p>

            <p className="muted">
              This prototype does not diagnose or determine clinical urgency.
            </p>

            <button
              type="button"
              onClick={() => {
                setAnswers({});
                setQuestionIndex(0);
                setResult(null);
              }}
            >
              Start a new conversation
            </button>
          </div>
        )}
      </section>

      <aside className="notice">
        <strong>Important medical safety notice</strong>
        <p>
          MediTriage is an academic prototype, not a diagnosis or
          clinically validated triage service. It cannot determine whether
          symptoms are safe or urgent. For possible emergencies, seek
          immediate professional help rather than waiting for this questionnaire.
        </p>
      </aside>

      <footer>Academic project · MediTriage</footer>
    </main>
  );
}
