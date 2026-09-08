import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, Users, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";

import api from "../utils/api";
import logo from "../assets/MASCOT.png";
import useDocumentTitle from "../hooks/useDocumentTitle";

export default function Login() {
  const navigate = useNavigate();
  useDocumentTitle("UTCBT 2026");

  const [loading, setLoading] = useState(false);
  const loginInFlight = useRef(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [form, setForm] = useState({
    token: "",
    participantName: "",
  });

  async function handleLogin(e) {
    e.preventDefault();
    if (loginInFlight.current) return;
    setError("");
    setInfoMessage("");

    if (!form.token.trim() || !form.participantName.trim()) {
      setError("Token dan nama tim wajib diisi.");
      return;
    }

    try {
      setLoading(true);
      loginInFlight.current = true;

      // Bersihkan sesi lama sebelum menyimpan token baru
      const { data } = await api.post("/auth/token-login", {
        token: form.token.trim().toUpperCase(),
        participantName: form.participantName.trim(),
      });

      if (!data.accessToken || !data.quizId || !data.attemptId) throw new Error("Invalid login response");
      if (localStorage.getItem("attemptId") !== data.attemptId) {
        localStorage.removeItem("savedAnswers");
        localStorage.removeItem("pendingAnswers");
      }
      localStorage.removeItem("quizStartedAt");
      sessionStorage.removeItem("quizAutoSubmitted");

      // Simpan kredensial utama
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("quizId", data.quizId);
      localStorage.setItem("attemptId", data.attemptId);

      // PERBAIKAN 2: Simpan startedAt hasil kalkulasi Recovery ke localStorage
      if (data.startedAt) {
        localStorage.setItem("quizStartedAt", data.startedAt);
      }

      // Jika backend mendeteksi ini adalah sesi recovery
      if (data.isRecovery) {
        setInfoMessage("Sesi ujian ditemukan. Memulihkan lembar pengerjaan...");
        navigate("/quiz", { replace: true });
      } else {
        navigate("/quiz");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Gagal masuk ke quiz. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
      loginInFlight.current = false;
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4 py-12 antialiased selection:bg-indigo-500/30">
      <div className="w-full max-w-md">
        
        {/* HEADER LOGO & BRANDING */}
        <div className="flex flex-col items-center mb-8">
          <img 
            src={logo} 
            alt="Tax Center UNPAM" 
            className="w-44 h-44 sm:w-48 sm:h-48 object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-105" 
          />
          
          <span className="px-3 py-1 mt-4 rounded-full bg-slate-800/60 border border-slate-700/50 text-[var(--secondary)] text-[10px] font-bold tracking-widest uppercase">
            National Tax Quiz 2026
          </span>
          
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)] text-center mt-3.5">
            TAX CENTER UNPAM
          </h1>
          
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] text-center mt-1 opacity-90 italic">
            The Evolution of Tax Systems
          </p>
        </div>

        {/* SECURE CARD FORM */}
        <form 
          onSubmit={handleLogin} 
          className="bg-[var(--surface)] border border-slate-800/60 rounded-2xl p-6 sm:p-8 shadow-xl shadow-black/10"
        >
          {/* TOAST ERROR */}
          {error && (
            <div className="flex items-start gap-3 mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle size={18} className="text-rose-400 mt-0.5 shrink-0" />
              <p className="text-xs font-medium text-rose-400 leading-relaxed">{error}</p>
            </div>
          )}

          {/* TOAST INFO RECOVERY */}
          {infoMessage && (
            <div className="flex items-start gap-3 mb-5 p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 animate-in fade-in slide-in-from-top-1 duration-200">
              <RefreshCw size={18} className="text-indigo-400 mt-0.5 shrink-0 animate-spin" />
              <p className="text-xs font-medium text-indigo-400 leading-relaxed">{infoMessage}</p>
            </div>
          )}

          {/* TOKEN FIELD */}
          <div className="mb-5">
            <label htmlFor="quiz-token" className="block mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Token Akses Quiz
            </label>
            <div className="relative group">
              <KeyRound 
                size={16} 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] transition-colors group-focus-within:text-indigo-400" 
              />
              <input
                id="quiz-token"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={128}
                type="text"
                placeholder="Masukkan token dari panitia"
                value={form.token}
                onChange={(e) => setForm({ ...form, token: e.target.value })}
                className="w-full bg-[var(--background)] border border-slate-800/80 rounded-xl pl-11 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder-slate-600 outline-none transition-all duration-200 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 font-mono tracking-wide uppercase"
                required
              />
            </div>
          </div>

          {/* TEAM FIELD */}
          <div className="mb-6">
            <label htmlFor="participant-name" className="block mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Nama Team / Peserta
            </label>
            <div className="relative group">
              <Users 
                size={16} 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] transition-colors group-focus-within:text-indigo-400" 
              />
              <input
                id="participant-name"
                maxLength={200}
                type="text"
                placeholder="Masukkan nama resmi tim Anda"
                value={form.participantName}
                onChange={(e) => setForm({ ...form, participantName: e.target.value })}
                className="w-full bg-[var(--background)] border border-slate-800/80 rounded-xl pl-11 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder-slate-600 outline-none transition-all duration-200 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10"
                required
              />
            </div>
          </div>

          {/* SUBMIT EXECUTION BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="group w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--secondary)] hover:opacity-95 text-[var(--background)] font-extrabold text-sm shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-[var(--background)] border-t-transparent rounded-full animate-spin"></div>
                <span>Menyiapkan Lembar Ujian...</span>
              </div>
            ) : (
              <>
                <span>Masuk ke Ruang Kuis</span>
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[var(--text-secondary)] text-xs mt-6 tracking-wide font-medium max-w-xs mx-auto leading-relaxed opacity-80">
          💡 Pastikan token telah divalidasi oleh panitia sebelum menekan tombol masuk.
        </p>
      </div>
    </div>
  );
}
