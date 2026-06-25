import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import {
  ArrowLeft,
  MonitorPlay,
  Users,
  Trophy,
  ShieldAlert,
  AlertTriangle,
  Radio,
  Eye,
} from "lucide-react";
import useDocumentTitle from "../../hooks/useDocumentTitle";

export default function LiveMonitor() {
  const navigate = useNavigate();
  useDocumentTitle("Live Monitor | TAXCUNPAM Admin");

  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");

  useEffect(() => {
    // Jalankan fetch pertama kali
    fetchMonitor();
    
    // Set interval untuk auto-pooling setiap 5 detik
    const interval = setInterval(fetchMonitor, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  async function fetchMonitor() {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await api.get("/admin/live-monitor", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setParticipants(res.data.participants || []);
      
      // Bersihkan error message jika re-fetch berhasil
      setMessage("");
    } catch (err) {
      // Jika terjadi error 401, biarkan Axios Interceptor di api.js yang menangani pengalihan halaman
      if (err.response?.status !== 401) {
        setMessageType("error");
        setMessage(err.response?.data?.message || "Gagal memperbarui data monitor");
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center text-[var(--text-secondary)] antialiased">
        <div className="w-12 h-12 border-4 border-slate-800 border-t-[var(--secondary)] rounded-full animate-spin mb-4" />
        <p className="text-base font-bold tracking-tight text-[var(--text-primary)]">Memuat Panel Monitor...</p>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Sinkronisasi aktivitas realtime peserta ujian sedang disiapkan.
        </p>
      </div>
    );
  }

  const active = participants.filter((p) => p.status === "in_progress").length;
  const submitted = participants.filter((p) => p.status === "submitted").length;
  const violations = participants.reduce((sum, p) => sum + (p.violation_count || 0), 0);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] antialiased px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER CONTROL */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-slate-800/40">
          <div>
            <button
              type="button"
              onClick={() => navigate("/admin/dashboard")}
              className="mb-4 flex items-center gap-2 bg-slate-800/40 border border-slate-800 hover:bg-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 shadow-sm"
            >
              <ArrowLeft size={14} />
              Dashboard
            </button>

            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/10 rounded-xl text-[var(--secondary)]">
                <MonitorPlay size={24} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Live Monitor</h1>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mt-1.5">
              Pantau jalannya ujian dan rekam jejak kecurangan integritas peserta.
            </p>

            {message && (
              <div className={`mt-4 flex items-center gap-2.5 p-3 rounded-xl text-xs font-medium border ${
                messageType === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
              }`}>
                <ShieldAlert size={16} />
                <span>{message}</span>
              </div>
            )}
          </div>

          {/* REFRESH CHIP */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/40 border border-slate-800 text-xs font-mono text-[var(--text-secondary)]">
            <Radio size={12} className="text-emerald-400 animate-pulse" />
            <span>Auto-refresh: 5s</span>
          </div>
        </div>

        {/* MONITOR METRICS STATUS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          {[
            { icon: <Users size={22} />, label: "Active Testing", value: active, color: "from-emerald-500/10 to-transparent", text: "text-emerald-400" },
            { icon: <Trophy size={22} />, label: "Submitted Quiz", value: submitted, color: "from-blue-500/10 to-transparent", text: "text-blue-400" },
            { icon: <ShieldAlert size={22} />, label: "Total Violations", value: violations, color: "from-rose-500/10 to-transparent", text: violations > 0 ? "text-rose-400 animate-pulse font-extrabold" : "text-slate-400" },
          ].map((item, index) => (
            <div
              key={index}
              className="relative overflow-hidden bg-[var(--surface)] border border-slate-800/60 rounded-2xl p-5 shadow-md shadow-black/5"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-30 pointer-events-none`} />
              <div className="relative flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    {item.label}
                  </p>
                  <h2 className={`text-3xl font-bold mt-1 tracking-tight ${item.text}`}>
                    {item.value}
                  </h2>
                </div>
                <div className="p-2.5 bg-slate-800/50 rounded-xl text-[var(--text-secondary)] border border-slate-700/30">
                  {item.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* DATA CONTAINER: TABLE */}
        <div className="bg-[var(--surface)] border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl shadow-black/5">
          <div className="px-6 py-4 border-b border-slate-800/40 bg-slate-900/10">
            <h2 className="text-sm font-bold tracking-wider uppercase text-[var(--text-secondary)]">
              Participant Activity Logs
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--background)] border-b border-slate-800/60 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  <th className="p-4">Participant</th>
                  <th className="p-4">Quiz Target</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Score</th>
                  <th className="p-4 text-center bg-rose-500/5 text-rose-400">Violations</th>
                  <th className="p-4 text-center">DevTools</th>
                  <th className="p-4 text-center">Fullscreen</th>
                  <th className="p-4 text-center">Tab Switch</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/40 text-sm">
                {participants.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-12 text-center text-xs text-[var(--text-secondary)] italic">
                      Belum ada pergerakan aktivitas dari peserta kuis.
                    </td>
                  </tr>
                ) : (
                  participants.map((p) => {
                    const hasViolations = (p.violation_count || 0) > 0;
                    return (
                      <tr key={p.id} className={`hover:bg-slate-900/30 transition-colors ${hasViolations ? "bg-rose-500/[0.01]" : ""}`}>
                        {/* NAME */}
                        <td className="p-4 font-semibold text-[var(--text-primary)] whitespace-nowrap">
                          {p.participant_name}
                        </td>

                        {/* QUIZ TITLE */}
                        <td className="p-4 text-xs text-[var(--text-secondary)] max-w-xs truncate">
                          {p?.quizzes?.title || "N/A"}
                        </td>

                        {/* LIVE STATUS */}
                        <td className="p-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            p.status === "submitted"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}>
                            {p.status === "in_progress" && (
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            )}
                            {p.status === "in_progress" ? "In Progress" : "Submitted"}
                          </span>
                        </td>

                        {/* SCORE */}
                        <td className="p-4 font-bold text-center tracking-tight text-indigo-400 font-mono">
                          {p.score ?? 0}
                        </td>

                        {/* ACCUMULATED VIOLATIONS */}
                        <td className={`p-4 text-center font-mono font-bold bg-rose-500/5 ${hasViolations ? "text-rose-400 text-base" : "text-slate-600"}`}>
                          {hasViolations ? (
                            <span className="inline-flex items-center gap-1">
                              <AlertTriangle size={12} className="text-rose-400" />
                              {p.violation_count}
                            </span>
                          ) : (
                            0
                          )}
                        </td>

                        {/* DETAIL: DEVTOOLS */}
                        <td className={`p-4 text-center font-mono text-xs ${(p.devtools_violations || 0) > 0 ? "text-rose-400/90 font-bold" : "text-slate-500"}`}>
                          {p.devtools_violations || 0}
                        </td>

                        {/* DETAIL: FULLSCREEN */}
                        <td className={`p-4 text-center font-mono text-xs ${(p.fullscreen_violations || 0) > 0 ? "text-rose-400/90 font-bold" : "text-slate-500"}`}>
                          {p.fullscreen_violations || 0}
                        </td>

                        {/* DETAIL: TAB SWITCH */}
                        <td className={`p-4 text-center font-mono text-xs ${(p.tab_switch_violations || 0) > 0 ? "text-rose-400/90 font-bold" : "text-slate-500"}`}>
                          {p.tab_switch_violations || 0}
                        </td>

                        {/* ACTION: CHECK ANSWER DETAIL */}
                        <td className="p-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/review-answers/${p.id}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-800 bg-slate-800/40 hover:bg-[var(--secondary)] hover:text-[var(--background)] hover:border-[var(--secondary)] transition-all duration-200"
                          >
                            <Eye size={13} />
                            Cek Jawaban
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}