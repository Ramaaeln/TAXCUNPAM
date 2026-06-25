import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import useAntiCheat from "../hooks/useAntiCheat";
import useDevtoolsDetect from "../hooks/useDevtoolsDetect";
import { Clock3, Flag, Send, AlertCircle, CheckCircle } from "lucide-react";
import logo from "../assets/MASCOT.png";
import useDocumentTitle from "../hooks/useDocumentTitle";

export default function Quiz() {
  const navigate = useNavigate();
  useDocumentTitle("Quiz | TAXCUNPAM 2026");

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [finishType, setFinishType] = useState("normal"); 
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizInfo, setQuizInfo] = useState(null);
  const [savedAnswers, setSavedAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [markedQuestions, setMarkedQuestions] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");

  const token = localStorage.getItem("accessToken");
  const quizId = localStorage.getItem("quizId");

  const submitQuiz = useCallback(async (type = "normal") => {
    if (submitting) return;

    try {
      setSubmitting(true);
      setFinishType(type);

      await api.post(
        "/quiz/submit",
        { reason: type },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
    } catch (error) {
      if (type === "normal") {
        setMessageType("error");
        setMessage(error.response?.data?.message || "Submit kuis gagal.");
        return; 
      }
      console.error("Automated submit due to violation failed:", error);
    } finally {
      setSubmitting(false);
      
      localStorage.removeItem("quizStartedAt");
      localStorage.removeItem("attemptId");
      localStorage.removeItem("savedAnswers");
      
      if (type === "cheated") {
        sessionStorage.setItem("quizAutoSubmitted", "true");
      }

      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      setIsFinished(true);
    }
  }, [token, submitting]);

  useAntiCheat(token, async () => {
    sessionStorage.setItem("quizAutoSubmitted", "true");
    await submitQuiz("cheated");
  });
  
  useDevtoolsDetect(token, () => submitQuiz("cheated"));

  useEffect(() => {
    const handleKeyDown = (event) => {
      const targetTag = event.target.tagName?.toLowerCase();
      
      if (targetTag === "textarea" || targetTag === "input") {
        if (event.key === " " && !event.ctrlKey && !event.altKey) {
          return; 
        }
      }

      if (event.key === "F12") {
        event.preventDefault();
        return;
      }

      if (
        event.ctrlKey &&
        event.shiftKey &&
        event.key &&
        ["I", "J", "C", "T", "X"].includes(event.key.toUpperCase())
      ) {
        event.preventDefault();
        return;
      }

      if (
        event.ctrlKey &&
        event.key &&
        event.key.trim() !== "" &&
        ["u", "c", "v", "j", "t", "x"].includes(event.key.toLowerCase())
      ) {
        event.preventDefault();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const disableContextMenu = (e) => e.preventDefault();
    document.addEventListener("contextmenu", disableContextMenu);
    return () => document.removeEventListener("contextmenu", disableContextMenu);
  }, []);

  async function fetchQuestions() {
    try {
      const response = await api.get(`/quiz/questions/${quizId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setQuestions(response.data.questions || []);
    } catch (error) {
      setMessageType("error");
      setMessage(error.response?.data?.message || "Gagal memuat soal.");
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
      const question = questions.find((q) => q.id === questionId);
      let finalAnswer = answer;

      if (question?.question_type === "short_answer") {
        finalAnswer = answer.replace(/\s+/g, " ");
      }

      const newAnswers = {
        ...savedAnswers,
        [questionId]: finalAnswer,
      };

      setSavedAnswers(newAnswers);
      localStorage.setItem("savedAnswers", JSON.stringify(newAnswers));

      let payload = { questionId };

      if (question?.question_type === "multiple_choice") {
        payload.selectedOptionId = finalAnswer;
      } else {
        payload.textAnswer = finalAnswer.trim();
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
    if (isFinished) return;
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
        if (!document.fullscreenElement && !isFinished) {
          await document.documentElement.requestFullscreen();
        }
      } catch {}
    };

    window.addEventListener("click", startFullscreen, { once: true });
    return () => window.removeEventListener("click", startFullscreen);
  }, [isFinished]);

  useEffect(() => {
    if (!quizInfo || isFinished) return;

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
        submitQuiz("normal");
        return;
      }

      setTimeLeft(remain);
    }, 1000);

    return () => clearInterval(interval);
  }, [quizInfo, submitQuiz, isFinished]);

  useEffect(() => {
    if (isFinished) return;
    const interval = setInterval(sendHeartbeat, 15000);
    return () => clearInterval(interval);
  }, [isFinished]);

  useEffect(() => {
    if (isFinished) return;
    const tabId = crypto.randomUUID();
    const channel = new BroadcastChannel("quiz_channel");

    channel.onmessage = async (event) => {
      if (event.data.type === "TAB_OPENED" && event.data.tabId !== tabId) {
        setMessageType("error");
        setMessage("Terdeteksi lebih dari satu tab quiz terbuka.");
        await submitQuiz("cheated");
      }
    };
    
    channel.postMessage({
      type: "TAB_OPENED",
      tabId,
    });

    return () => channel.close();
  }, [submitQuiz, isFinished]);

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }
  
  const answeredCount = Object.keys(savedAnswers).length;
  const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center gap-4 px-4 antialiased">
        <img src={logo} alt="Tax Center UNPAM" className="w-20 h-20 object-contain drop-shadow-2xl animate-pulse" />
        <div className="w-10 h-10 border-4 border-slate-800 border-t-[var(--secondary)] rounded-full animate-spin" />
        <div className="text-center">
          <h2 className="text-base font-bold text-[var(--text-primary)]">Membuat Lembar Soal...</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Harap tenang, sistem anti-cheat sedang disinkronisasikan.</p>
        </div>
      </div>
    );
  }

  if (isFinished) {
    const isCheated = finishType === "cheated";

    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4 antialiased">
        <div className={`bg-[var(--surface)] border ${isCheated ? 'border-rose-500/30 shadow-rose-950/10' : 'border-slate-800/60 shadow-black/10'} rounded-2xl p-6 sm:p-8 shadow-xl max-w-md w-full text-center space-y-6`}>
          <div className="flex justify-center">
            <div className={`p-4 rounded-full ${isCheated ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'}`}>
              {isCheated ? <AlertCircle size={40} /> : <CheckCircle size={40} />}
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className={`text-xl font-extrabold tracking-tight ${isCheated ? 'text-rose-400' : 'text-[var(--text-primary)]'}`}>
              {isCheated ? "Sesi Ujian Ditutup Paksa" : "Ujian Selesai!"}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed opacity-95">
              {isCheated 
                ? "Sistem mendeteksi adanya tindakan pelanggaran integritas (Membuka DevTools / Keluar layar penuh / Membuka tab ganda). Seluruh lembar pengerjaan Anda telah dibekukan dan otomatis dikirimkan ke server."
                : "Seluruh jawaban Anda telah berhasil diarsipkan dengan aman. Terima kasih atas partisipasi Anda dalam kompetisi Tax Quiz 2026."
              }
            </p>
          </div>
          
          <button
            onClick={() => navigate("/")}
            className={`w-full py-3 rounded-xl font-bold text-xs transition shadow-sm ${
              isCheated ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
            }`}
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] antialiased px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER TRACKER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-slate-800/40">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">Quiz Session</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Jawablah semua pertanyaan secara jujur sebelum tenggat berakhir.</p>
          </div>
          
          {/* TIMER */}
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 rounded-xl text-rose-400 font-mono font-bold text-sm shadow-inner">
            <Clock3 size={16} className="opacity-80" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* BROADCAST MESSAGES */}
        {message && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 animate-in fade-in duration-200">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span className="text-xs font-medium leading-relaxed">{message}</span>
          </div>
        )}

        {/* WORKSPACE AREA */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* LEFT SIDE: MAIN QUESTION CELL */}
          <div className="lg:col-span-3">
            {questions[currentQuestion] && (
              <div className="bg-[var(--surface)] border border-slate-800/60 rounded-2xl p-5 sm:p-6 shadow-md shadow-black/5">
                <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-800/40">
                  <h2 className="font-extrabold text-lg sm:text-xl tracking-tight">Soal {currentQuestion + 1}</h2>
                  
                  <button
                    onClick={() => toggleMarkQuestion(questions[currentQuestion].id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      markedQuestions.includes(questions[currentQuestion].id)
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                        : "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    <Flag size={13} />
                    {markedQuestions.includes(questions[currentQuestion].id) ? "Ditandai" : "Tandai Soal"}
                  </button>
                </div>

                <p className="mb-6 text-sm sm:text-base font-medium leading-relaxed text-[var(--text-primary)]">
                  {questions[currentQuestion].question_text}
                </p>

                {/* RENDERING OPTION BY TYPE */}
                {questions[currentQuestion].question_type === "multiple_choice" ? (
                  <div className="space-y-2.5">
                    {questions[currentQuestion].question_options?.map((option) => {
                      const isSelected = savedAnswers[questions[currentQuestion].id] === option.id;
                      return (
                        <label
                          key={option.id}
                          className={`flex items-start gap-3 p-3.5 rounded-xl cursor-pointer transition border text-xs sm:text-sm font-medium ${
                            isSelected
                              ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-400 font-semibold"
                              : "bg-[var(--background)] border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          <input
                            type="radio"
                            name="quiz_option"
                            checked={isSelected}
                            onChange={() => saveAnswer(questions[currentQuestion].id, option.id)}
                            className="w-4 h-4 text-indigo-500 focus:ring-indigo-500/20 accent-indigo-500 mt-0.5 cursor-pointer"
                          />
                          <span className="leading-relaxed">{option.option_text}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <textarea
                    placeholder="Ketikkan jawaban Anda secara singkat di sini..."
                    value={savedAnswers[questions[currentQuestion].id] || ""}
                    onChange={(e) => saveAnswer(questions[currentQuestion].id, e.target.value)}
                    className="w-full h-32 bg-[var(--background)] border border-slate-800 rounded-xl p-4 text-sm text-[var(--text-primary)] placeholder-slate-600 outline-none resize-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition"
                  />
                )}

                {/* STEERING PAGINATION BUTTONS */}
                <div className="flex gap-3 mt-8 pt-4 border-t border-slate-800/40">
                  <button
                    disabled={currentQuestion === 0}
                    onClick={() => setCurrentQuestion(currentQuestion - 1)}
                    className="flex-1 bg-slate-800/40 text-slate-300 border border-slate-800 hover:bg-slate-800 py-2.5 rounded-xl text-xs font-bold transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Sebelumnya
                  </button>
                  <button
                    disabled={currentQuestion === questions.length - 1}
                    onClick={() => setCurrentQuestion(currentQuestion + 1)}
                    className="flex-1 bg-[var(--secondary)] hover:opacity-95 text-[var(--background)] py-2.5 rounded-xl text-xs font-bold transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDE: STEERING NAVIGATION GRID */}
          <div className="bg-[var(--surface)] border border-slate-800/60 rounded-2xl p-5 h-fit lg:sticky lg:top-5 shadow-md shadow-black/5 space-y-5">
            <div>
              <h2 className="font-bold text-sm tracking-wide text-[var(--text-primary)] mb-3">Navigasi Soal</h2>
              <div className="flex justify-between text-[11px] text-[var(--text-secondary)] font-medium mb-1.5">
                <span>Progress Pengisian</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 bg-[var(--background)] border border-slate-800/60 rounded-full overflow-hidden">
                <div className="h-full bg-[var(--secondary)] transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* NUMERICAL GRID SYSTEM */}
            <div className="grid grid-cols-5 gap-1.5 max-h-64 overflow-y-auto pr-0.5 custom-scrollbar">
              {questions.map((question, index) => {
                const isCurrent = currentQuestion === index;
                const isAnswered = !!savedAnswers[question.id];
                const isMarked = markedQuestions.includes(question.id);

                let badgeStyles = "bg-slate-800/40 text-slate-400 border-slate-800 hover:border-slate-700";
                if (isCurrent) {
                  badgeStyles = "bg-indigo-500/10 text-indigo-400 border-indigo-500/50";
                } else if (isAnswered) {
                  badgeStyles = "bg-[var(--secondary)]/10 text-[var(--secondary)] border-[var(--secondary)]/30";
                } else if (isMarked) {
                  badgeStyles = "bg-amber-500/10 text-amber-400 border-amber-500/30";
                }

                return (
                  <button
                    key={question.id}
                    onClick={() => setCurrentQuestion(index)}
                    className={`h-9 border rounded-lg text-xs font-bold transition-all ${badgeStyles}`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            {/* COLOR INSIGHT LEGEND */}
            <div className="pt-2 border-t border-slate-800/40 space-y-2 text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded border border-[var(--secondary)]/30 bg-[var(--secondary)]/10" />
                <span>Sudah Dijawab</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded border border-amber-500/30 bg-amber-500/10" />
                <span>Ditandai (Ragu)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded border border-indigo-500/50 bg-indigo-500/10" />
                <span>Soal Aktif Saat Ini</span>
              </div>
            </div>

            {/* FINISH SUBMIT BUTTON */}
            <div className="pt-2">
              <button
                onClick={() => submitQuiz("normal")}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-1.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-white text-rose-400 py-3 rounded-xl text-xs font-bold transition-all duration-300 disabled:opacity-50"
              >
                <Send size={13} />
                <span>Akhiri Sesi Ujian</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}