import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Mail,
  Lock,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

import api from "../../utils/api";
import useDocumentTitle from "../../hooks/useDocumentTitle";

export default function AdminLogin() {
  const navigate = useNavigate();
  useDocumentTitle("Admin Login | TAXCUNPAM Admin");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

      navigate("/admin/dashboard");
    } catch (error) {
      setError(
        error.response?.data?.message || "Login gagal. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4 py-12 antialiased selection:bg-indigo-500/30">
      <div className="w-full max-w-md">
        
        {/* HEADER */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-slate-800/40 flex items-center justify-center mb-4 shadow-sm backdrop-blur-sm">
            <ShieldCheck
              size={36}
              className="text-[var(--secondary)]"
            />
          </div>

          <span className="px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 text-[var(--secondary)] text-[10px] font-bold tracking-widest uppercase">
            Secure Area
          </span>

          <h1 className="text-3xl font-extrabold tracking-tight mt-4 text-[var(--text-primary)]">
            Admin Panel
          </h1>

          <p className="text-sm text-[var(--text-secondary)] text-center mt-1.5 max-w-xs">
            Masuk untuk mengelola sistem kuis, token, dan data peserta.
          </p>
        </div>

        {/* FORM CARD */}
        <form
          onSubmit={handleLogin}
          className="bg-[var(--surface)] border border-slate-800/60 rounded-2xl p-6 sm:p-8 shadow-xl shadow-black/10"
        >
          {/* ALERT ERROR */}
          {error && (
            <div className="flex items-start gap-3 mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle
                size={18}
                className="text-rose-400 mt-0.5 shrink-0"
              />
              <p className="text-xs font-medium text-rose-400 leading-relaxed">
                {error}
              </p>
            </div>
          )}

          {/* EMAIL INPUT */}
          <div className="mb-5">
            <label className="block mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Email Address
            </label>
            <div className="relative group">
              <Mail
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] transition-colors group-focus-within:text-indigo-400"
              />
              <input
                type="email"
                placeholder="admin@email.com"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
                className="w-full bg-[var(--background)] border border-slate-800/80 rounded-xl pl-11 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder-slate-600 outline-none transition-all duration-200 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10"
                required
              />
            </div>
          </div>

          {/* PASSWORD INPUT */}
          <div className="mb-6">
            <label className="block mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Password
            </label>
            <div className="relative group">
              <Lock
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] transition-colors group-focus-within:text-indigo-400"
              />
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) =>
                  setForm({
                    ...form,
                    password: e.target.value,
                  })
                }
                className="w-full bg-[var(--background)] border border-slate-800/80 rounded-xl pl-11 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder-slate-600 outline-none transition-all duration-200 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10"
                required
              />
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="group w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--secondary)] hover:opacity-95 text-[var(--background)] font-bold text-sm shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-[var(--background)] border-t-transparent rounded-full animate-spin"></div>
                <span>Mengautentikasi...</span>
              </div>
            ) : (
              <>
                <span>Masuk ke Dashboard</span>
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[var(--text-secondary)] text-xs mt-6 tracking-wide font-mono opacity-80">
          🔒 TLS Secure Authentication Enabled
        </p>
      </div>
    </div>
  );
}