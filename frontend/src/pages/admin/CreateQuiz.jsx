import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FilePlus2, AlertCircle, CheckCircle2, Clock, Calendar } from "lucide-react";
import api from "../../utils/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import useDocumentTitle from "../../hooks/useDocumentTitle";

export default function CreateQuiz() {
  const navigate = useNavigate();
  useDocumentTitle("Create Quiz | TAXCUNPAM Admin");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");

  const [form, setForm] = useState({
    title: "",
    description: "",
    duration_minutes: 60,
    start_time: "",
    end_time: "",
  });
  const [startDate, setStartDate] = useState(null);

  const calculatedEndDate = startDate
    ? new Date(startDate.getTime() + form.duration_minutes * 60 * 1000)
    : null;

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      start_time: startDate ? startDate.toISOString() : "",
      end_time: calculatedEndDate ? calculatedEndDate.toISOString() : "",
    }));
  }, [startDate, calculatedEndDate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (!startDate) {
      setMessageType("error");
      setMessage("Silakan tentukan waktu mulai kuis.");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");

      await api.post("/admin/create-quiz", form, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMessageType("success");
      setMessage("Quiz berhasil dibuat");

      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 1200);
    } catch (err) {
      setMessageType("error");
      setMessage(err.response?.data?.message || "Gagal membuat quiz");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] antialiased px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* BACK ACTION */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center gap-2 bg-slate-800/40 border border-slate-800 hover:bg-slate-800 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 shadow-sm"
          >
            <ArrowLeft size={14} />
            Dashboard
          </button>
        </div>

        {/* COMPONENT BOX */}
        <div className="bg-[var(--surface)] border border-slate-800/60 rounded-2xl p-6 sm:p-8 shadow-xl shadow-black/5">
          
          {/* HEADER */}
          <div className="mb-8 pb-6 border-b border-slate-800/40">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/10 rounded-xl text-[var(--secondary)]">
                <FilePlus2 size={24} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Create Quiz</h1>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mt-1.5">
              Buat dan publikasikan paket kuis baru untuk diakses oleh para peserta.
            </p>
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

          {/* FORM SETUP */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* QUIZ TITLE */}
            <div>
              <label className="block mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Quiz Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Contoh: Kuis Perpajakan Dasar UNPAM"
                className="w-full bg-[var(--background)] border border-slate-800/80 rounded-xl px-4 py-3 text-sm outline-none transition focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10"
                required
              />
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="block mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Tulis instruksi atau deskripsi singkat kuis..."
                className="w-full h-32 bg-[var(--background)] border border-slate-800/80 rounded-xl p-4 text-sm outline-none transition focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 resize-none"
                required
              />
            </div>

            {/* DURATION TUNER */}
            <div>
              <label className="block mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Duration (Minutes)
              </label>
              <div className="relative max-w-xs group">
                <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-indigo-400" />
                <input
                  type="number"
                  min="5"
                  value={form.duration_minutes}
                  onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                  className="w-full bg-[var(--background)] border border-slate-800/80 rounded-xl pl-11 pr-4 py-2.5 text-sm outline-none focus:border-indigo-500/50"
                  required
                />
              </div>
              
              {/* FAST SELECT CHIPS */}
              <div className="flex gap-2 mt-2.5 flex-wrap">
                {[30, 60, 90, 120].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setForm({ ...form, duration_minutes: mins })}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                      form.duration_minutes === mins
                        ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-400"
                        : "bg-slate-800/30 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    {mins} Menit
                  </button>
                ))}
              </div>
            </div>

            {/* TIMELINE SCHEDULER */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              
              {/* START TIME */}
              <div>
                <label className="block mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Start Time
                </label>
                <div className="relative custom-datepicker-container">
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    showTimeSelect
                    timeIntervals={15}
                    dateFormat="dd/MM/yyyy HH:mm"
                    placeholderText="Pilih tanggal & jam mulai"
                    className="w-full bg-[var(--background)] border border-slate-800/80 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500/50"
                  />
                </div>
              </div>

              {/* AUTOMATED END TIME */}
              <div>
                <label className="block mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  End Time (Auto Calculated)
                </label>
                <div className="w-full min-h-[46px] flex items-center bg-slate-900/30 border border-slate-800/80 rounded-xl px-4 py-2.5 text-sm font-medium font-mono text-indigo-400">
                  {calculatedEndDate ? (
                    <span className="flex items-center gap-2">
                      <Calendar size={14} className="opacity-70" />
                      {calculatedEndDate.toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  ) : (
                    <span className="text-slate-600 text-xs font-sans italic">Menunggu penetapan waktu mulai...</span>
                  )}
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3.5 rounded-xl bg-[var(--secondary)] hover:opacity-95 text-[var(--background)] font-extrabold text-sm shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Menerbitkan Paket Kuis..." : "Terbitkan Kuis Sekarang"}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}