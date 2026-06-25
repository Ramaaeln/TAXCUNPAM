import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, LogOut, CheckCircle } from "lucide-react";
import logo from "../assets/MASCOT.png";
import api from "../utils/api";
import useDocumentTitle from "../hooks/useDocumentTitle";

export default function Result() {
  const navigate = useNavigate();
  useDocumentTitle("Result | TAXCUNPAM 2026");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const autoSubmitted = sessionStorage.getItem("quizAutoSubmitted");

  async function fetchResult() {
    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        navigate("/");
        return;
      }

      const response = await api.get("/quiz/result", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setResult(response.data.result);
    } catch {
      navigate("/");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchResult();
  }, []);

  useEffect(() => {
    if (autoSubmitted) {
      sessionStorage.removeItem("quizAutoSubmitted");
    }
  }, [autoSubmitted]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center gap-4 px-4 antialiased">
        <img src={logo} alt="Tax Center UNPAM" className="w-20 h-20 object-contain drop-shadow-2xl animate-pulse" />
        <div className="w-10 h-10 border-4 border-slate-800 border-t-[var(--secondary)] rounded-full animate-spin" />
        <div className="text-center">
          <h2 className="text-base font-bold text-[var(--text-primary)]">Memuat Ringkasan Sesi...</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Harap tunggu, mengamankan data pengerjaan Anda.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4 py-12 antialiased">
      <div className={`w-full max-w-md bg-[var(--surface)] border ${
        autoSubmitted ? 'border-rose-500/30 shadow-rose-950/5' : 'border-slate-800/60 shadow-black/10'
      } rounded-2xl p-6 sm:p-8 text-center shadow-xl`}>
        
        {/* CONDITION STATE CHIP */}
        <div className="flex justify-center mb-5">
          <div className={`p-4 rounded-full border ${
            autoSubmitted 
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/10' 
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10'
          }`}>
            {autoSubmitted ? <AlertCircle size={36} /> : <CheckCircle size={36} />}
          </div>
        </div>

        {/* BRANDING MASCOT */}
        <img src={logo} alt="Tax Center UNPAM" className="w-16 h-16 mx-auto object-contain drop-shadow-md mb-4 pointer-events-none select-none" />

        {/* NOTIFICATION TYPOGRAPHY */}
        <h1 className={`text-xl sm:text-2xl font-extrabold tracking-tight mb-2.5 ${
          autoSubmitted ? 'text-rose-400' : 'text-[var(--text-primary)]'
        }`}>
          {autoSubmitted ? "Sesi Ditutup Secara Paksa" : "Sesi Ujian Selesai!"}
        </h1>

        <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed mb-8 opacity-95">
          {autoSubmitted 
            ? "Sistem mendeteksi adanya tindakan pelanggaran integritas (Membuka DevTools / Keluar dari layar penuh / Membuka tab ganda). Lembar ujian Anda otomatis dibekukan dan disimpan ke server basis data."
            : "Terima kasih telah mengikuti kompetisi ini secara jujur dan suportif. Lembar pengerjaan Anda berhasil diarsipkan. Mohon tunggu informasi pengumuman selanjutnya."
          }
        </p>

        {/* EXIT DESTRUCTIVE ACTION BUTTON */}
        <button
          onClick={() => {
            localStorage.clear();
            sessionStorage.clear();
            navigate("/");
          }}
          className={`w-full flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold transition-all shadow-sm text-white ${
            autoSubmitted ? 'bg-rose-500 hover:bg-rose-600' : 'bg-slate-800 border border-slate-700 hover:bg-slate-700'
          }`}
        >
          <LogOut size={14} />
          <span>Keluar & Selesai</span>
        </button>
      </div>
    </div>
  );
}