import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle, FileText, User, Award, Clock } from "lucide-react";
import api from "../../utils/api";
import useDocumentTitle from "../../hooks/useDocumentTitle";

export default function ReviewAnswers() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  useDocumentTitle("Review Jawaban Peserta | UTCBT");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attemptInfo, setAttemptInfo] = useState(null);
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    async function fetchReviewData() {
      try {
        const token = localStorage.getItem("adminToken");
        const res = await api.get(`/admin/review-answers/${attemptId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          setAttemptInfo(res.data.attempt || null);
          setAnswers(res.data.answers || []);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Gagal memuat data review jawaban peserta.");
      } finally {
        setLoading(false);
      }
    }
    fetchReviewData();
  }, [attemptId]);

  // Mengurutkan jawaban berdasarkan order_number, jika sama/null maka urutkan berdasarkan ID atau created_at
  const sortedAnswers = useMemo(() => {
    return [...answers].sort((a, b) => {
      const qA = a.questions || {};
      const qB = b.questions || {};

      const orderA = qA.order_number && qA.order_number > 0 ? qA.order_number : null;
      const orderB = qB.order_number && qB.order_number > 0 ? qB.order_number : null;

      if (orderA !== null && orderB !== null) {
        return orderA - orderB;
      }
      
      // Jika order_number di database null/0, gunakan urutan ID atau created_at agar konsisten
      return (qA.id || "").localeCompare(qB.id || "");
    });
  }, [answers]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center text-[var(--text-secondary)] antialiased">
        <div className="w-12 h-12 border-4 border-slate-800 border-t-[var(--secondary)] rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide text-[var(--text-primary)]">Memuat lembar jawaban...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] antialiased px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* BACK BUTTON ACTION */}
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 bg-slate-800/40 border border-slate-800 hover:bg-slate-800 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 shadow-sm"
          >
            <ArrowLeft size={14} />
            Kembali
          </button>
        </div>

        {/* CONTAINER WORKSPACE */}
        <div className="bg-[var(--surface)] border border-slate-800/60 rounded-2xl p-6 sm:p-8 shadow-xl shadow-black/5">
          
          {/* HEADER REVIEW */}
          <div className="mb-8 pb-6 border-b border-slate-800/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400">
                <FileText size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">Review Jawaban</h1>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Analisis detail lembar pengerjaan dan akurasi nilai peserta.
                </p>
              </div>
            </div>
          </div>

          {/* ATTEMPT METADATA CARD */}
          {attemptInfo && (
            <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[var(--background)] border border-slate-800/80 p-4 rounded-xl text-xs">
              <div className="flex items-center gap-3">
                <User size={18} className="text-indigo-400 shrink-0" />
                <div>
                  <span className="text-[10px] uppercase text-[var(--text-secondary)] block font-semibold">Nama Peserta</span>
                  <span className="font-bold text-sm text-[var(--text-primary)]">{attemptInfo.participant_name || "-"}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-800/80 pt-3 sm:pt-0 sm:pl-4">
                <Award size={18} className="text-amber-400 shrink-0" />
                <div>
                  <span className="text-[10px] uppercase text-[var(--text-secondary)] block font-semibold">Total Skor</span>
                  <span className="font-bold text-sm text-amber-400">{attemptInfo.score ?? 0} Poin</span>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-800/80 pt-3 sm:pt-0 sm:pl-4">
                <Clock size={18} className="text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] uppercase text-[var(--text-secondary)] block font-semibold">Status Ujian</span>
                  <span className="font-bold text-xs uppercase text-emerald-400">{attemptInfo.status || "-"}</span>
                </div>
              </div>
            </div>
          )}

          {/* ERROR ALERT */}
          {error && (
            <div className="mb-6 p-4 rounded-xl border text-xs font-medium bg-rose-500/10 border-rose-500/20 text-rose-400">
              {error}
            </div>
          )}

          {/* LIST ANSWERS CONTAINER */}
          <div className="space-y-6">
            {sortedAnswers.length === 0 ? (
              <div className="text-center py-10 text-xs text-[var(--text-secondary)]">
                Belum ada data jawaban yang tersimpan untuk peserta ini.
              </div>
            ) : (
              sortedAnswers.map((ans, index) => {
                const q = ans.questions || {};
                const qOptions = q.question_options || [];

                let isCorrect = false;
                if (q.question_type === "multiple_choice") {
                  const selectedOpt = qOptions.find((o) => o.id === ans.selected_option_id);
                  isCorrect = Boolean(selectedOpt?.is_correct);
                } else {
                  const userText = ans.text_answer?.trim().toLowerCase().replace(/\s+/g, " ");
                  const keyText = q.short_answer?.trim().toLowerCase().replace(/\s+/g, " ");
                  isCorrect = Boolean(userText && keyText && userText === keyText);
                }

                return (
                  <div
                    key={ans.id || `answer-${index}`}
                    className={`border rounded-xl p-5 sm:p-6 transition-all ${
                      isCorrect ? "bg-slate-900/10 border-slate-800/80" : "bg-rose-500/[0.01] border-rose-950/30"
                    }`}
                  >
                    {/* METADATA BLOCK */}
                    <div className="flex justify-between items-center gap-4 mb-4 flex-wrap border-b border-slate-800/40 pb-3">
                      <h3 className="font-bold text-sm sm:text-base tracking-wide flex items-center gap-2">
                        {/* PENOMORAN DIPERBAIKI: Menggunakan index + 1 agar konsisten 1, 2, 3... */}
                        <span className="text-xs font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                          Soal Nomor {index + 1}
                        </span>
                        <span className="text-xs font-medium text-[var(--text-secondary)]">
                          ({q.points || 0} Poin)
                        </span>
                      </h3>

                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          isCorrect
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {isCorrect ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        {isCorrect ? "Benar" : "Salah"}
                      </span>
                    </div>

                    {/* QUESTION TEXT */}
                    <p className="text-sm font-medium leading-relaxed mb-5 text-[var(--text-primary)]">
                      {q.question_text || "(Teks soal tidak ditemukan)"}
                    </p>

                    {/* CONDITIONAL LAYOUT BY TYPE */}
                    {q.question_type === "multiple_choice" ? (
                      <div className="space-y-2.5 pl-1 border-l-2 border-slate-800">
                        {qOptions.map((opt) => {
                          const isChosen = opt.id === ans.selected_option_id;
                          return (
                            <div
                              key={opt.id}
                              className={`p-3 rounded-xl border text-xs flex justify-between items-center gap-4 transition-all ${
                                isChosen
                                  ? "border-indigo-500/60 bg-indigo-500/10 font-semibold text-indigo-300"
                                  : opt.is_correct
                                  ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                                  : "border-slate-800 bg-slate-900/20 text-[var(--text-secondary)]"
                              }`}
                            >
                              <span className="leading-relaxed">{opt.option_text}</span>

                              <div className="flex gap-1.5 shrink-0">
                                {isChosen && (
                                  <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                                    Pilihan Peserta
                                  </span>
                                )}
                                {opt.is_correct && (
                                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                    Kunci Jawaban
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/30 border border-slate-800/60 p-4 rounded-xl text-xs font-medium">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] block">
                            Jawaban Peserta
                          </span>
                          <p className={`text-sm font-semibold tracking-wide ${isCorrect ? "text-emerald-400" : "text-rose-400"}`}>
                            {ans.text_answer || "(Kosong / Tidak diisi)"}
                          </p>
                        </div>

                        <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-800/80 pt-2 sm:pt-0 sm:pl-4">
                          <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] block">
                            Kunci Jawaban Resmi
                          </span>
                          <p className="text-sm font-semibold tracking-wide text-emerald-400 font-mono">
                            {q.short_answer || "-"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>
    </div>
  );
}