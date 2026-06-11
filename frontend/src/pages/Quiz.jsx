import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import useAntiCheat from "../hooks/useAntiCheat";
import useDevtoolsDetect from "../hooks/useDevtoolsDetect";
import { Clock3, Flag, Send, AlertCircle } from "lucide-react";
import logo from "../assets/MASCOT.png";
import useDocumentTitle from "../hooks/useDocumentTitle";

export default function Quiz() {
  const navigate = useNavigate();
  useDocumentTitle("Quiz | TAXCUNPAM 2026");

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizInfo, setQuizInfo] = useState(null);
  const [savedAnswers, setSavedAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [markedQuestions, setMarkedQuestions] = useState([]);
  const [message, setMessage] = useState("");

  const [messageType, setMessageType] = useState("error");
  const token = localStorage.getItem("accessToken");
  const quizId = localStorage.getItem("quizId");

  const submitQuiz = useCallback(async () => {
    if (submitting) return;

    try {
      setSubmitting(true);

      await api.post(
        "/quiz/submit",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      localStorage.removeItem("quizStartedAt");
      localStorage.removeItem("attemptId");
      localStorage.removeItem("savedAnswers");
      sessionStorage.setItem("quizAutoSubmitted", "true");

      navigate("/result");
    } catch (error) {
      setMessageType("error");
      setMessage(error.response?.data?.message || "Submit quiz failed");
    } finally {
      setSubmitting(false);
    }
  }, [navigate, token, submitting]);

  useAntiCheat(
  token,
  () => {
    sessionStorage.setItem(
      "quizAutoSubmitted",
      "true"
    );

    navigate("/result");
  }
);
  useDevtoolsDetect(token, submitQuiz);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "F12") {
        event.preventDefault();
      }

      if (
        event.ctrlKey &&
        event.shiftKey &&
        ["I", "J", "C", "T", "X"].includes(event.key.toUpperCase())
      ) {
        event.preventDefault();
      }

      if (
        event.ctrlKey &&
        ["u", "c", "v", "j", "t", "x"].includes(event.key.toLowerCase())
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const disableContextMenu = (e) => e.preventDefault();

    document.addEventListener("contextmenu", disableContextMenu);

    return () =>
      document.removeEventListener("contextmenu", disableContextMenu);
  }, []);

  async function fetchQuestions() {
    try {
      const response = await api.get(`/quiz/questions/${quizId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setQuestions(response.data.questions);
    } catch (error) {
      setMessageType("error");
      setMessage(error.response?.data?.message || "Failed to load questions");

      navigate("/");
    } finally {
      setLoading(false);
    }
  }

  async function fetchQuizInfo() {
    try {
      const response = await api.get(`/quiz/info/${quizId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setQuizInfo(response.data.quiz);
    } catch {}
  }

  async function saveAnswer(questionId, answer) {
    try {
      const newAnswers = {
        ...savedAnswers,
        [questionId]: answer,
      };

      setSavedAnswers(newAnswers);

      localStorage.setItem("savedAnswers", JSON.stringify(newAnswers));

      const question = questions.find((q) => q.id === questionId);

      let payload = {
        questionId,
      };

      // MULTIPLE CHOICE
      if (question?.question_type === "multiple_choice") {
        payload.selectedOptionId = answer;
      }

      // SHORT ANSWER
      else {
        payload.textAnswer = answer;
      }

      await api.post("/quiz/autosave", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {}
  }
  function toggleMarkQuestion(questionId) {
    setMarkedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId],
    );
  }

  async function sendHeartbeat() {
    try {
      await api.post(
        "/quiz/heartbeat",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
    } catch {}
  }

  useEffect(() => {
    fetchQuestions();
    fetchQuizInfo();
  }, []);
  useEffect(() => {
    const stored = localStorage.getItem("savedAnswers");

    if (stored) {
      setSavedAnswers(JSON.parse(stored));
    }
  }, []);
  useEffect(() => {
    const startFullscreen = async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch {}
    };

    window.addEventListener("click", startFullscreen, { once: true });

    return () => window.removeEventListener("click", startFullscreen);
  }, []);

  useEffect(() => {
    if (!quizInfo) return;

    const duration = quizInfo.duration_minutes * 60;

    let started = localStorage.getItem("quizStartedAt");

    if (!started) {
      started = new Date().toISOString();

      localStorage.setItem("quizStartedAt", started);
    }

    const startedAt = new Date(started);

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000);

      const remain = duration - elapsed;

      if (remain <= 0) {
        clearInterval(interval);

        submitQuiz();

        return;
      }

      setTimeLeft(remain);
    }, 1000);

    return () => clearInterval(interval);
  }, [quizInfo, submitQuiz]);

  useEffect(() => {
    const interval = setInterval(sendHeartbeat, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const tabId = crypto.randomUUID();

    const channel = new BroadcastChannel("quiz_channel");

    channel.onmessage = async (event) => {
      if (event.data.type === "TAB_OPENED" && event.data.tabId !== tabId) {
        setMessageType("error");

        setMessage("Terdeteksi lebih dari satu tab quiz terbuka.");

        await submitQuiz();
      }
    };
    channel.postMessage({
      type: "TAB_OPENED",
      tabId,
    });

    return () => channel.close();
  }, [submitQuiz]);

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);

    const s = seconds % 60;

    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }
  const answeredCount = Object.keys(savedAnswers).length;

  const progress =
    questions.length > 0
      ? Math.round((answeredCount / questions.length) * 100)
      : 0;

  if (loading) {
  return (
    <div
      className="
      min-h-screen
      bg-[var(--background)]
      flex
      flex-col
      items-center
      justify-center
      gap-5
      px-4
      "
    >
      <img
              src={logo}
              alt="Tax Center UNPAM"
              className="
              w-24
              h-24
              object-contain
              drop-shadow-2xl
              "
            />
      <div
        className="
        w-14
        h-14
        rounded-full
        border-4
        border-[var(--border)]
        border-t-[var(--secondary)]
        animate-spin
        "
      />

      <div className="text-center">
        <h2
          className="
          text-xl
          font-semibold
          text-[var(--text-primary)]
          "
        >
          Memuat Soal...
        </h2>

        <p
          className="
          mt-2
          text-sm
          text-[var(--text-secondary)]
          "
        >
          Mohon tunggu sebentar.
        </p>
      </div>
    </div>
  );
}

  return (
  <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] p-4 md:p-6">
    {/* HEADER */}
    <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">
          Quiz Session
        </h1>

        <p className="text-[var(--text-secondary)]">
          Jawab semua soal sebelum waktu habis
        </p>
      </div>

      <div
        className="
        flex
        items-center
        gap-2
        bg-[var(--danger)]/10
        border
        border-[var(--danger)]/20
        px-5
        py-3
        rounded-2xl
        text-[var(--danger)]
        font-bold
        "
      >
        <Clock3 size={18} />
        {formatTime(timeLeft)}
      </div>
    </div>

    {/* MESSAGE */}
    {message && (
      <div
        className="
        mb-6
        flex
        items-center
        gap-3
        p-4
        rounded-2xl
        bg-[var(--danger)]/10
        border
        border-[var(--danger)]/20
        text-[var(--danger)]
        "
      >
        <AlertCircle size={18} />
        <span>{message}</span>
      </div>
    )}

    <div className="grid lg:grid-cols-4 gap-6">
      {/* QUESTION */}
      <div className="lg:col-span-3">
        {questions[currentQuestion] && (
          <div
            className="
            bg-[var(--surface)]
            border
            border-[var(--border)]
            rounded-3xl
            p-6
            shadow-xl
            "
          >
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-bold text-2xl">
                Soal {currentQuestion + 1}
              </h2>

              <button
                onClick={() =>
                  toggleMarkQuestion(questions[currentQuestion].id)
                }
                className="
                flex
                items-center
                gap-2
                px-4
                py-2
                rounded-xl
                bg-[var(--secondary)]/10
                text-[var(--secondary)]
                hover:bg-[var(--secondary)]/20
                transition
                "
              >
                <Flag size={16} />
                Tandai
              </button>
            </div>

            <p className="mb-8 text-lg leading-relaxed text-[var(--text-primary)]">
              {questions[currentQuestion].question_text}
            </p>

            {questions[currentQuestion].question_type ===
            "multiple_choice" ? (
              <div className="space-y-4">
                {questions[currentQuestion].question_options?.map(
                  (option) => (
                    <label
                      key={option.id}
                      className={`
                      flex
                      gap-4
                      p-4
                      rounded-2xl
                      cursor-pointer
                      transition
                      border

                      ${
                        savedAnswers[
                          questions[currentQuestion].id
                        ] === option.id
                          ? `
                            bg-[var(--secondary)]/15
                            border-[var(--secondary)]
                            text-[var(--text-primary)]
                          `
                          : `
                            bg-[var(--background)]
                            border-[var(--border)]
                            hover:border-[var(--secondary)]
                          `
                      }
                      `}
                    >
                      <input
                        type="radio"
                        checked={
                          savedAnswers[
                            questions[currentQuestion].id
                          ] === option.id
                        }
                        onChange={() =>
                          saveAnswer(
                            questions[currentQuestion].id,
                            option.id
                          )
                        }
                        className="accent-[var(--secondary)]"
                      />

                      <span>{option.option_text}</span>
                    </label>
                  )
                )}
              </div>
            ) : (
              <textarea
                placeholder="Masukkan jawaban..."
                value={
                  savedAnswers[
                    questions[currentQuestion].id
                  ] || ""
                }
                onChange={(e) =>
                  saveAnswer(
                    questions[currentQuestion].id,
                    e.target.value
                  )
                }
                className="
                w-full
                h-36
                bg-[var(--background)]
                border
                border-[var(--border)]
                rounded-2xl
                p-4
                text-[var(--text-primary)]
                placeholder:text-[var(--text-secondary)]
                placeholder:opacity-60
                outline-none
                resize-none
                focus:border-[var(--secondary)]
                focus:ring-2
                focus:ring-[var(--secondary)]/20
                transition
                "
              />
            )}

            <div className="flex gap-3 mt-8">
              <button
                disabled={currentQuestion === 0}
                onClick={() =>
                  setCurrentQuestion(currentQuestion - 1)
                }
                className="
                flex-1
                bg-[var(--surface-secondary)]
                hover:bg-[var(--primary)]
                py-3
                rounded-xl
                transition
                disabled:opacity-50
                "
              >
                Sebelumnya
              </button>

              <button
                disabled={
                  currentQuestion === questions.length - 1
                }
                onClick={() =>
                  setCurrentQuestion(currentQuestion + 1)
                }
                className="
                flex-1
                bg-[var(--secondary)]
                hover:bg-[var(--accent)]
                text-[var(--background)]
                py-3
                rounded-xl
                font-semibold
                transition
                disabled:opacity-50
                "
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SIDEBAR */}
      <div
        className="
        bg-[var(--surface)]
        border
        border-[var(--border)]
        rounded-3xl
        p-5
        h-fit
        sticky
        top-5
        shadow-xl
        "
      >
        <h2 className="font-bold text-xl mb-4">
          Navigasi
        </h2>

        {/* PROGRESS */}
        <div className="mb-5">
          <div className="flex justify-between text-sm text-[var(--text-secondary)] mb-2">
            <span>Progress</span>

            <span>{progress}%</span>
          </div>

          <div className="h-2 bg-[var(--background)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--secondary)] transition-all"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {questions.map((question, index) => (
            <button
              key={question.id}
              onClick={() => setCurrentQuestion(index)}
              className={`
                h-11
                rounded-xl
                font-bold
                transition

                ${
                  currentQuestion === index
                    ? "bg-[var(--primary)] text-white"
                    : savedAnswers[question.id]
                    ? "bg-[var(--secondary)] text-[var(--background)]"
                    : markedQuestions.includes(question.id)
                    ? "bg-[var(--accent)] text-[var(--background)]"
                    : "bg-[var(--surface-secondary)] hover:bg-[var(--primary)]"
                }
              `}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-2 text-sm text-[var(--text-secondary)]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[var(--secondary)]" />
            Sudah dijawab
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[var(--accent)]" />
            Ditandai
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[var(--primary)]" />
            Soal aktif
          </div>
        </div>

        <button
          onClick={submitQuiz}
          disabled={submitting}
          className="
          w-full
          mt-6
          flex
          items-center
          justify-center
          gap-2
          bg-[var(--danger)]
          hover:opacity-90
          py-4
          rounded-2xl
          font-semibold
          transition
          disabled:opacity-50
          "
        >
          <Send size={18} />

          {submitting
            ? "Submitting..."
            : "Submit Quiz"}
        </button>
      </div>
    </div>
  </div>
);
}
