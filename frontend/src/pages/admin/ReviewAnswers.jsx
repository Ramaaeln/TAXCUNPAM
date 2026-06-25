import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle, FileText, HelpCircle } from "lucide-react";
import api from "../../utils/api";
import useDocumentTitle from "../../hooks/useDocumentTitle";

export default function ReviewAnswers() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  useDocumentTitle("Review Jawaban Peserta | Admin");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState([]);
  const [allOptions, setAllOptions] = useState([]);

  useEffect(() => {
    async function fetchReviewData() {
      try {
        const token = localStorage.getItem("adminToken");
        const res = await api.get(`/admin/review-answers/${attemptId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          setAnswers(res.data.answers || []);
          setAllOptions(res.data.allOptions || []);
        }
      } catch (err) {
        setError("Gagal memuat data review jawaban peserta.");
      } finally {
        setLoading(false);
      }
    }
    fetchReviewData();
  }, [attemptId]);

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
      <div className="max-w-4xl mx-auto">
        
        {/* BACK BUTTON ACTION */}
        <div className="mb-6">
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
          
          {/* HEADER */}
          <div className="mb-8 pb-6 border-b border-slate-800/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/10 rounded-xl text-[var(--secondary)]">
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

          {/* ERROR ALERT */}
          {error && (
            <div className="mb-6 p-4 rounded-xl border text-xs font-medium bg-rose-500/10 border-rose-500/20 text-rose-400">
              {error}
            </div>
          )}

          {/* LIST ANSWERS CONTAINER */}
          <div className="space-y-6">
            {answers.map((ans, index) => {
              const q = ans.questions;
              const qOptions = allOptions.filter((o) => o.question_id === ans.question_id);
              
              let isCorrect = false;
              if (q.question_type === "multiple_choice") {
                const selectedOpt = qOptions.find((o) => o.id === ans.selected_option_id);
                isCorrect = selectedOpt?.is_correct || false;
              } else {
                isCorrect = ans.text_answer?.trim().toLowerCase().replace(/\s+/g, " ") === q.short_answer?.trim().toLowerCase().replace(/\s+/g, " ");
              }

              return (
                <div 
                  key={ans.id} 
                  className={`border rounded-xl p-5 sm:p-6 transition-all ${
                    isCorrect ? "bg-slate-900/10 border-slate-800/80" : "bg-rose-500/[0.01] border-rose-950/30"
                  }`}
                >
                  {/* METADATA BLOCK */}
                  <div className="flex justify-between items-center gap-4 mb-4 flex-wrap border-b border-slate-800/40 pb-3">
                    <h3 className="font-bold text-sm sm:text-base tracking-wide flex items-center gap-2">
                      <span className="text-xs font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded">Soal {index + 1}</span>
                      <span className="text-xs font-medium text-[var(--text-secondary)]">({q.points} Poin)</span>
                    </h3>
                    
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      isCorrect 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {isCorrect ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      {isCorrect ? "Benar" : "Salah"}
                    </span>
                  </div>

                  {/* QUESTION TEXT */}
                  <p className="text-sm font-medium leading-relaxed mb-5 text-[var(--text-primary)]">
                    {q.question_text}
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
                                ? 'border-[var(--secondary)] bg-[var(--secondary)]/5 font-semibold text-amber-300' 
                                : opt.is_correct 
                                ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' 
                                : 'border-slate-800 bg-slate-900/20 text-[var(--text-secondary)]'
                            }`}
                          >
                            <span className="leading-relaxed">{opt.option_text}</span>
                            
                            <div className="flex gap-1.5 shrink-0">
                              {isChosen && (
                                <span className="text-[10px] font-bold text-[var(--secondary)] bg-[var(--secondary)]/10 border border-[var(--secondary)]/20 px-2 py-0.5 rounded-md">
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
                        <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] block">Jawaban Peserta</span>
                        <p className={`text-sm font-semibold tracking-wide ${isCorrect ? "text-emerald-400" : "text-rose-400"}`}>
                          {ans.text_answer || "(Kosong / Tidak diisi)"}
                        </p>
                      </div>

                      <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-800/80 pt-2 sm:pt-0 sm:pl-4">
                        <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] block">Kunci Jawaban Resmi</span>
                        <p className="text-sm font-semibold tracking-wide text-emerald-400 font-mono">
                          {q.short_answer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}