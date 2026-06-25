import { useState, useEffect } from "react";
import api from "../../utils/api";
import { AlertCircle, CheckCircle2, Trash2, FileQuestion, ArrowLeft, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useDocumentTitle from "../../hooks/useDocumentTitle";

export default function CreateQuestion() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  useDocumentTitle("Create Question | TAXCUNPAM Admin");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    quiz_id: "",
    question_text: "",
    question_type: "multiple_choice",
    points: 10,
    options: ["", ""],
    correct_option: 0,
    short_answer: "",
  });

  useEffect(() => {
    fetchQuizzes();
  }, []);

  useEffect(() => {
    if (!form.quiz_id) return;
    fetchQuestions();
  }, [form.quiz_id]);

  async function fetchQuizzes() {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await api.get("/admin/quizzes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuizzes(res.data.quizzes || []);
    } catch {
      setMessageType("error");
      setMessage("Gagal memuat daftar quiz");
    } finally {
      setLoadingQuizzes(false);
    }
  }

  async function fetchQuestions() {
    try {
      setLoadingQuestions(true);
      const token = localStorage.getItem("adminToken");
      const res = await api.get(`/admin/questions/${form.quiz_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuestions(res.data.questions || []);
    } catch {
      setMessageType("error");
      setMessage("Gagal memuat soal");
    } finally {
      setLoadingQuestions(false);
    }
  }

  function handleEdit(question) {
    const options = question.question_options?.map((option) => option.option_text) || ["", ""];
    const correctIndex = question.question_options?.findIndex((option) => option.is_correct) ?? 0;

    setEditingId(question.id);
    setForm({
      quiz_id: question.quiz_id,
      question_text: question.question_text,
      question_type: question.question_type,
      points: question.points,
      options,
      correct_option: correctIndex,
      // FIX: Ubah question.correct_answer menjadi question.short_answer sesuai nama kolom database Supabase
      short_answer: question.short_answer || "", 
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    if (!window.confirm("Apakah Anda yakin ingin menghapus soal ini?")) return;
    try {
      const token = localStorage.getItem("adminToken");
      await api.delete(`/admin/delete-question/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessageType("success");
      setMessage("Soal berhasil dihapus");
      await fetchQuestions();
    } catch (err) {
      setMessageType("error");
      setMessage(err.response?.data?.message || err.message || "Gagal menghapus soal");
    }
  }

  function addOption() {
    if (form.options.length >= 6) {
      setMessageType("error");
      setMessage("Maksimal 6 pilihan");
      return;
    }
    setForm({ ...form, options: [...form.options, ""] });
  }

  function updateOption(value, index) {
    const updated = [...form.options];
    updated[index] = value;
    setForm({ ...form, options: updated });
  }

  function removeOption(index) {
    if (form.options.length <= 2) {
      setMessageType("error");
      setMessage("Minimal 2 pilihan");
      return;
    }
    const updated = form.options.filter((_, i) => i !== index);
    let correct = form.correct_option;
    if (correct >= updated.length) correct = updated.length - 1;

    setForm({ ...form, options: updated, correct_option: correct });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (!form.quiz_id) {
      setMessageType("error");
      setMessage("Silakan pilih kuis terlebih dahulu.");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const payload = {
        quiz_id: form.quiz_id,
        question_text: form.question_text,
        question_type: form.question_type,
        points: Number(form.points),
        options: form.options,
        correct_option: form.correct_option,
        short_answer: form.short_answer,
      };

      if (editingId) {
        await api.put(`/admin/update-question/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessageType("success");
        setMessage("Soal berhasil diperbarui");
        setEditingId(null);
      } else {
        await api.post("/admin/create-question", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessageType("success");
        setMessage("Soal berhasil dibuat");
      }

      setForm({
        quiz_id: form.quiz_id,
        question_text: "",
        question_type: "multiple_choice",
        points: 10,
        options: ["", ""],
        correct_option: 0,
        short_answer: "",
      });
      await fetchQuestions();
    } catch (err) {
      setMessageType("error");
      setMessage(err.response?.data?.message || "Gagal menyimpan soal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] antialiased px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-slate-800/40">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/10 rounded-xl text-[var(--secondary)]">
                <FileQuestion size={24} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Question Management
              </h1>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mt-1.5">
              Tambah, edit, dan organisasikan bank soal kuis Anda.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center gap-2 bg-slate-800/40 border border-slate-800 hover:bg-slate-800 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 shadow-sm"
          >
            <ArrowLeft size={14} />
            Dashboard
          </button>
        </div>

        {/* NOTIFICATION MESSAGE */}
        {message && (
          <div
            className={`mb-6 flex items-start gap-3 p-4 rounded-xl border animate-in fade-in slide-in-from-top-1 duration-200 ${
              messageType === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/20 text-rose-400"
            }`}
          >
            {messageType === "success" ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
            <span className="text-xs font-medium leading-relaxed">{message}</span>
          </div>
        )}

        {/* MAIN WORKSPACE GRID */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* LEFT COLUMN: QUESTION CONTENT */}
          <div className="md:col-span-2 space-y-6 bg-[var(--surface)] border border-slate-800/60 rounded-2xl p-6 shadow-md shadow-black/5">
            <div>
              <label className="block mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Isi Pertanyaan / Soal
              </label>
              <textarea
                value={form.question_text}
                onChange={(e) => setForm({ ...form, question_text: e.target.value })}
                placeholder="Tuliskan draf soal di sini..."
                className="w-full h-36 bg-[var(--background)] border border-slate-800/80 rounded-xl p-4 text-sm outline-none transition focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 resize-none"
                required
              />
            </div>

            {/* MULTIPLE CHOICE TYPE */}
            {form.question_type === "multiple_choice" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/40">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Pilihan Jawaban & Kunci
                  </label>
                  <button
                    type="button"
                    onClick={addOption}
                    className="flex items-center gap-1 text-xs font-bold text-[var(--secondary)] hover:opacity-80 transition"
                  >
                    <Plus size={14} />
                    Tambah Opsi
                  </button>
                </div>

                <div className="space-y-3">
                  {form.options.map((option, index) => {
                    const isCorrect = form.correct_option === index;
                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-3 p-2 rounded-xl transition-all border ${
                          isCorrect 
                            ? "bg-emerald-500/5 border-emerald-500/30" 
                            : "bg-transparent border-transparent"
                        }`}
                      >
                        <input
                          type="radio"
                          name="correct_choice"
                          checked={isCorrect}
                          onChange={() => setForm({ ...form, correct_option: index })}
                          className="w-4 h-4 text-emerald-500 focus:ring-emerald-500/20 accent-emerald-500 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(e.target.value, index)}
                          placeholder={`Pilihan ${String.fromCharCode(65 + index)}`}
                          className="flex-1 bg-[var(--background)] border border-slate-800/80 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-500/50"
                          required={form.question_type === "multiple_choice"}
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="text-slate-500 hover:text-rose-400 p-2 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SHORT ANSWER TYPE */}
            {form.question_type === "short_answer" && (
              <div className="animate-in fade-in duration-200">
                <label className="block mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Jawaban Singkat yang Benar
                </label>
                <input
                  type="text"
                  value={form.short_answer}
                  onChange={(e) => setForm({ ...form, short_answer: e.target.value })}
                  placeholder="Masukkan kata kunci jawaban valid..."
                  className="w-full bg-[var(--background)] border border-slate-800/80 rounded-xl p-4 text-sm outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10"
                  required={form.question_type === "short_answer"}
                />
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: CONTROLS & METADATA */}
          <div className="space-y-4 bg-[var(--surface)] border border-slate-800/60 rounded-2xl p-6 shadow-md shadow-black/5">
            <div>
              <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Pilih Paket Quiz
              </label>
              <select
                value={form.quiz_id}
                onChange={(e) => setForm({ ...form, quiz_id: e.target.value })}
                className="w-full bg-[var(--background)] border border-slate-800/80 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500/50 cursor-pointer"
                required
              >
                <option value="">{loadingQuizzes ? "Memuat paket..." : "== Pilih Kuis =="}</option>
                {quizzes.map((quiz) => (
                  <option key={quiz.id} value={quiz.id}>{quiz.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Tipe Evaluasi
              </label>
              <select
                value={form.question_type}
                onChange={(e) => setForm({ ...form, question_type: e.target.value })}
                className="w-full bg-[var(--background)] border border-slate-800/80 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500/50 cursor-pointer"
              >
                <option value="multiple_choice">Pilihan Ganda</option>
                <option value="short_answer">Isian Singkat</option>
              </select>
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Bobot Nilai (Poin)
              </label>
              <input
                type="number"
                min="1"
                value={form.points}
                onChange={(e) => setForm({ ...form, points: e.target.value })}
                className="w-full bg-[var(--background)] border border-slate-800/80 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500/50"
                required
              />
            </div>

            <div className="pt-4 space-y-2.5">
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm({
                      quiz_id: form.quiz_id,
                      question_text: "",
                      question_type: "multiple_choice",
                      points: 10,
                      options: ["", ""],
                      correct_option: 0,
                      short_answer: "",
                    });
                  }}
                  className="w-full border border-slate-800 text-slate-400 hover:bg-slate-800 py-3 rounded-xl text-xs font-bold transition-all"
                >
                  Batal Edit Mode
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--secondary)] hover:opacity-95 text-[var(--background)] py-3 rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50"
              >
                {loading ? "Memproses data..." : editingId ? "Simpan Perubahan" : "Terbitkan Soal Baru"}
              </button>
            </div>
          </div>
        </form>

        {/* DATA CONTAINER: EXISTING QUESTIONS */}
        <div className="mt-10 bg-[var(--surface)] border border-slate-800/60 rounded-2xl p-6 shadow-md shadow-black/5">
          <div className="mb-6">
            <h2 className="text-lg font-bold tracking-tight">Existing Questions</h2>
            <p className="text-xs text-[var(--text-secondary)]">Daftar soal yang berada di dalam paket kuis ini</p>
          </div>

          {loadingQuestions ? (
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] py-4">
              <div className="w-4 h-4 border-2 border-slate-700 border-t-[var(--secondary)] rounded-full animate-spin"></div>
              <span>Memuat bank data soal...</span>
            </div>
          ) : !form.quiz_id ? (
            <p className="text-xs text-amber-400 bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl font-mono">
              💡 Tips: Pilih paket kuis di atas untuk memfilter daftar soal yang sudah dibuat.
            </p>
          ) : questions.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)] py-4 italic">Belum ada soal terdaftar untuk kuis ini.</p>
          ) : (
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q.id} className="bg-[var(--background)] border border-slate-800/60 rounded-xl p-5 hover:border-slate-700 transition">
                  <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-800/40 px-2 py-0.5 rounded-md">
                        #{idx + 1}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                        {q.question_type === "multiple_choice" ? "Pilihan Ganda" : "Isian Singkat"}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-[var(--secondary)] bg-indigo-500/5 border border-indigo-500/10 px-2.5 py-0.5 rounded-lg">
                      {q.points} Poin
                    </span>
                  </div>

                  <p className="text-sm font-semibold leading-relaxed mb-4 text-[var(--text-primary)]">
                    {q.question_text}
                  </p>

                  {/* FIX FIX FIX: RENDERING UNTUK MASING-MASING TIPE SOAL */}
                  {q.question_type === "multiple_choice" ? (
                    q.question_options?.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2 border-l-2 border-slate-800">
                        {q.question_options.map((option, index) => (
                          <div key={option.id} className={`text-xs p-2 rounded-lg ${option.is_correct ? "text-emerald-400 bg-emerald-500/5 font-medium" : "text-[var(--text-secondary)] bg-slate-900/20"}`}>
                            <span className="font-mono mr-1.5">{String.fromCharCode(65 + index)}.</span>
                            {option.option_text}
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    // FIX: Ditambahkan container pembaca untuk menampilkan data Kunci Jawaban Isian Singkat
                    <div className="pl-3 border-l-2 border-emerald-500 bg-emerald-500/5 p-3 rounded-xl max-w-md">
                      <p className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider">Kunci Jawaban Singkat:</p>
                      <p className="text-sm text-emerald-400 font-mono font-bold mt-0.5">{q.short_answer || "(Belum disetel)"}</p>
                    </div>
                  )}

                  <div className="flex gap-2 mt-5 pt-4 border-t border-slate-800/40 justify-end">
                    <button
                      type="button"
                      onClick={() => handleEdit(q)}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(q.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white text-xs font-semibold transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}