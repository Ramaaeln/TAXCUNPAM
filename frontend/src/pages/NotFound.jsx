import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Home, FileQuestion } from "lucide-react";
import useDocumentTitle from "../hooks/useDocumentTitle";

export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();
  useDocumentTitle("404 - Halaman Tidak Ditemukan | UTCBT");

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-4 antialiased selection:bg-zinc-800">
      <div className="w-full max-w-md">
        
        {/* CARD CONTAINER */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* HEADER ICON & STATUS */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400">
                <FileQuestion size={18} />
              </div>
              <span className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider">
                Error 404
              </span>
            </div>
            <span className="text-xs font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-full font-medium">
              Not Found
            </span>
          </div>

          {/* MAIN CONTENT */}
          <div className="space-y-3">
            <h1 className="text-xl font-bold tracking-tight text-white">
              Halaman Tidak Ditemukan
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Alamat URL yang Anda tuju tidak tersedia, telah dipindahkan, atau memerlukan hak akses khusus.
            </p>

            {/* PATH Context Badge */}
            <div className="pt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800/80 text-[11px] font-mono text-zinc-500 max-w-full truncate">
                <span className="shrink-0 text-zinc-600">PATH:</span>
                <span className="truncate text-zinc-300">{location.pathname}</span>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-2 space-y-2.5">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition shadow-sm cursor-pointer"
            >
              <Home size={14} />
              <span>Halaman Utama</span>
            </button>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-semibold text-xs transition cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Kembali ke Halaman Sebelumnya</span>
            </button>
          </div>

        </div>

        {/* SYSTEM FOOTER */}
        <p className="text-center text-zinc-600 text-[11px] font-mono mt-6">
          UTCBT System Protocol &bull; 404_ROUTE_EXCEPTION
        </p>

      </div>
    </div>
  );
}