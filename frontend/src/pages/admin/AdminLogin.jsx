import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, AlertCircle, Eye, EyeOff, Shield, ArrowRight } from "lucide-react";

import api from "../../utils/api";
import logo from "../../assets/MASCOT.png";
import useDocumentTitle from "../../hooks/useDocumentTitle";

export default function AdminLogin() {
  const navigate = useNavigate();
  useDocumentTitle("Internal Login | UTCBT");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password.trim()) {
      setError("Email dan password wajib diisi.");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/admin/login", form);
      const data = response.data;

      localStorage.setItem("adminToken", data.accessToken);
      localStorage.setItem("adminUser", JSON.stringify(data.user));

      navigate("/utcbt-internal/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Kredensial tidak valid. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] flex items-center justify-center px-4 py-12 antialiased selection:bg-indigo-500/30">
      <div className="w-full max-w-md">
        
        {/* HEADER LOGO & BRANDING */}
        <div className="flex flex-col items-center mb-8">
          <img 
            src={logo} 
            alt="Tax Center UNPAM" 
            className="w-36 h-36 sm:w-40 sm:h-40 object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-105" 
          />
          
          <span className="flex items-center gap-1.5 px-3 py-1 mt-4 rounded-full bg-slate-800/60 border border-slate-700/50 text-[var(--secondary)] text-[10px] font-bold tracking-widest uppercase">
            <Shield size={12} /> Internal System Administrator
          </span>
          
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)] text-center mt-3">
            UTCBT INTERNAL
          </h1>
          
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] text-center mt-1 opacity-90">
            Masuk dengan akun otorisasi untuk mengelola sistem.
          </p>
        </div>

        {/* SECURE CARD FORM */}
        <div className="bg-[var(--surface)] border border-slate-800/60 rounded-2xl p-6 sm:p-8 shadow-xl shadow-black/10">
          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* ERROR ALERT */}
            {error && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span className="text-xs font-medium leading-relaxed">{error}</span>
              </div>
            )}

            {/* EMAIL INPUT */}
            <div>
              <label className="block mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Email Administrator
              </label>
              <div className="relative group">
                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] transition-colors group-focus-within:text-indigo-400"
                />
                <input
                  type="email"
                  placeholder="admin@utcbt.id"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  className="w-full bg-[var(--background)] border border-slate-800/80 rounded-xl pl-11 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder-slate-600 outline-none transition-all duration-200 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10"
                  required
                />
              </div>
            </div>

            {/* PASSWORD INPUT */}
            <div>
              <label className="block mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Kata Sandi
              </label>
              <div className="relative group">
                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] transition-colors group-focus-within:text-indigo-400"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="w-full bg-[var(--background)] border border-slate-800/80 rounded-xl pl-11 pr-11 py-3 text-sm text-[var(--text-primary)] placeholder-slate-600 outline-none transition-all duration-200 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="group w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--secondary)] hover:opacity-95 text-[var(--background)] font-extrabold text-sm shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-[var(--background)] border-t-transparent rounded-full animate-spin" />
                  <span>Memverifikasi Otorisasi...</span>
                </div>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* FOOTER METADATA */}
        <p className="text-center text-[var(--text-secondary)] text-xs mt-6 tracking-wide font-medium opacity-80">
          UTCBT System Internal Authorization Node
        </p>

      </div>
    </div>
  );
}