import { useNavigate } from "react-router-dom";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";
import logo from "../assets/MASCOT.png";
import useDocumentTitle from "../hooks/useDocumentTitle";

export default function NotFound() {
  const navigate = useNavigate();
  useDocumentTitle("404 - Halaman Tidak Ditemukan | TAXCUNPAM 2026");

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-4 antialiased selection:bg-indigo-500/30">
      <div className="w-full max-w-md bg-[var(--surface)] border border-slate-800/60 rounded-2xl p-6 sm:p-8 text-center shadow-xl shadow-black/10 space-y-6">
        
        {/* VISUAL ILLUSTRATION CHIP */}
        <div className="relative flex justify-center py-2">
          <img 
            src={logo} 
            alt="Tax Center UNPAM" 
            className="w-28 h-28 object-contain opacity-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none" 
          />
          <div className="p-4 bg-rose-500/10 text-rose-400 rounded-full shadow-inner border border-rose-500/10 z-10 transition-transform duration-300 hover:scale-105">
            <AlertTriangle size={44} />
          </div>
        </div>

        {/* TYPOGRAPHY OVERVIEW */}
        <div className="space-y-2">
          <h1 className="text-6xl font-black tracking-tighter text-rose-500 font-mono">
            404
          </h1>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Halaman Tidak Ditemukan
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-xs mx-auto opacity-90">
            Maaf, rute yang Anda tuju tidak tersedia, telah dipindahkan, atau Anda tidak memiliki hak akses otentikasi.
          </p>
        </div>

        {/* INTERACTION ACTION BUTTONS */}
        <div className="flex flex-col gap-2.5 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="w-full flex items-center justify-center gap-2 bg-slate-800/40 border border-slate-800 hover:bg-slate-800 text-slate-300 py-3 rounded-xl text-xs font-bold transition-all duration-200"
          >
            <ArrowLeft size={14} />
            Kembali Ke Sebelumnya
          </button>

          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center justify-center gap-2 bg-[var(--secondary)] hover:opacity-95 text-[var(--background)] py-3 rounded-xl text-xs font-bold shadow-md transition-all duration-200"
          >
            <Home size={14} />
            Menuju Halaman Utama
          </button>
        </div>

      </div>
    </div>
  );
}