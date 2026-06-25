import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Users,
  Trophy,
  Activity,
  Ticket,
  HelpCircle,
  Radio,
  LogOut,
  ArrowRight,
} from "lucide-react";

import api from "../../utils/api";
import useDocumentTitle from "../../hooks/useDocumentTitle";

export default function AdminDashboard() {
  const navigate = useNavigate();
  useDocumentTitle("Admin Dashboard | TAXCUNPAM Admin");

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuiz: 0,
    participants: 0,
    submissions: 0,
    activeQuiz: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem("adminToken");

    if (!token) {
      navigate("/admin");
      return;
    }

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchStats() {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await api.get("/admin/dashboard-stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setStats(res.data);
    } catch {
      navigate("/admin");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.clear();
    navigate("/admin");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col gap-3 items-center justify-center text-slate-400 font-medium tracking-wide">
        <div className="w-6 h-6 border-2 border-slate-700 border-t-[var(--secondary)] rounded-full animate-spin"></div>
        <span>Memuat dashboard...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] antialiased selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-6 border-b border-slate-800/40">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/10 rounded-xl text-[var(--secondary)]">
                <LayoutDashboard size={24} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Admin Dashboard
              </h1>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mt-1.5 flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Realtime monitoring system
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="group flex items-center gap-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-sm"
          >
            <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
            Logout
          </button>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { icon: <FileText size={24} />, label: "Total Quiz", value: stats.totalQuiz, color: "from-blue-500/10 to-transparent" },
            { icon: <Users size={24} />, label: "Participants", value: stats.participants, color: "from-purple-500/10 to-transparent" },
            { icon: <Trophy size={24} />, label: "Submissions", value: stats.submissions, color: "from-amber-500/10 to-transparent" },
            { icon: <Activity size={24} />, label: "Active Quiz", value: stats.activeQuiz, color: "from-emerald-500/10 to-transparent" },
          ].map((item, index) => (
            <div
              key={index}
              className="relative overflow-hidden bg-[var(--surface)] border border-slate-800/60 rounded-2xl p-6 shadow-md shadow-black/5 hover:border-slate-700 transition-all duration-300"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-40 pointer-events-none`} />
              <div className="relative flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    {item.label}
                  </p>
                  <h2 className="text-3xl font-bold mt-2 tracking-tight">
                    {item.value.toLocaleString()}
                  </h2>
                </div>
                <div className="p-2.5 bg-slate-800/50 rounded-xl text-[var(--secondary)] border border-slate-700/30">
                  {item.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* LOWER SECTION (GRID 2 SECTIONS) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* QUICK ACCESS (Lebih Lebar) */}
          <div className="lg:col-span-2 bg-[var(--surface)] border border-slate-800/60 rounded-2xl p-6 shadow-md shadow-black/5">
            <div className="mb-6">
              <h2 className="text-lg font-bold tracking-tight">Quick Access</h2>
              <p className="text-xs text-[var(--text-secondary)]">Akses cepat ke semua fitur manajemen inti</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: <FileText size={22} />, title: "Quiz", desc: "Kelola pembuatan & list kuis", path: "/admin/create-quiz" },
                { icon: <Ticket size={22} />, title: "Token", desc: "Generate & pantau token masuk", path: "/admin/tokens" },
                { icon: <Trophy size={22} />, title: "Leaderboard", desc: "Lihat ringkasan ranking peserta", path: "/admin/leaderboard" },
                { icon: <Users size={22} />, title: "Participant", desc: "Manajemen basis data peserta", path: "/admin/participants" },
                { icon: <HelpCircle size={22} />, title: "Question", desc: "Bank soal dan kunci jawaban", path: "/admin/questions" },
                { icon: <Radio size={22} />, title: "Live Monitor", desc: "Pantau aktivitas ujian langsung", path: "/admin/live-monitor" },
              ].map((menu, index) => (
                <button
                  key={index}
                  onClick={() => navigate(menu.path)}
                  className="group relative flex items-start gap-4 bg-[var(--background)] border border-slate-800/50 rounded-xl p-4 text-left transition-all duration-300 hover:border-indigo-500/40 hover:bg-slate-900/40"
                >
                  <div className="p-2.5 bg-slate-800/60 rounded-lg text-[var(--secondary)] group-hover:scale-105 transition-transform">
                    {menu.icon}
                  </div>
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="font-semibold text-sm tracking-wide text-[var(--text-primary)] group-hover:text-indigo-400 transition-colors">
                      {menu.title}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-1">
                      {menu.desc}
                    </p>
                  </div>
                  <ArrowRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-indigo-400" />
                </button>
              ))}
            </div>
          </div>

          {/* OVERVIEW SIDEBAR */}
          <div className="bg-[var(--surface)] border border-slate-800/60 rounded-2xl p-6 shadow-md shadow-black/5 flex flex-col justify-between">
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-bold tracking-tight">Overview Info</h2>
                <p className="text-xs text-[var(--text-secondary)]">Ringkasan cepat aktivitas saat ini</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-[var(--background)] border border-slate-800/50 rounded-xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">Status Kuis Aktif</span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-medium">Live</span>
                  </div>
                  <p className="text-xl font-bold tracking-tight">{stats.activeQuiz} Kuis Berjalan</p>
                </div>

                <div className="p-4 bg-[var(--background)] border border-slate-800/50 rounded-xl">
                  <span className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">Rasio Partisipan</span>
                  <p className="text-sm font-medium">
                    {stats.submissions > 0 ? ((stats.submissions / stats.participants) * 100).toFixed(1) : 0}% Penyelesaian
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/40 text-[10px] text-[var(--text-secondary)] text-center font-mono">
              Auto-sync teratur aktif (5s)
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}