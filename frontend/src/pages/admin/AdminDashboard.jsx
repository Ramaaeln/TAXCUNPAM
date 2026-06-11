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
  Database,
  Server,
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
      <div
        className="
      min-h-screen
      bg-slate-950
      flex
      items-center
      justify-center
      text-slate-400
      "
      >
        Memuat dashboard...
      </div>
    );
  }

 return (
  <div
    className="
    min-h-screen
    bg-[var(--background)]
    text-[var(--text-primary)]
    p-5
    "
  >
    <div className="max-w-7xl mx-auto">
      {/* HEADER */}

      <div
        className="
        flex
        justify-between
        items-center
        flex-wrap
        gap-4
        mb-10
        "
      >
        <div>
          <div className="flex items-center gap-3">
            <LayoutDashboard
              size={32}
              className="text-[var(--secondary)]"
            />

            <h1 className="text-4xl font-bold">
              Admin Dashboard
            </h1>
          </div>

          <p className="text-[var(--text-secondary)]">
            Realtime monitoring system
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="
          flex
          items-center
          gap-2
          bg-[var(--danger)]
          hover:opacity-90
          px-5
          py-3
          rounded-2xl
          font-semibold
          transition
          "
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {/* STATS */}

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {[
          [
            <FileText size={32} />,
            "Quiz",
            stats.totalQuiz,
          ],

          [
            <Users size={32} />,
            "Participant",
            stats.participants,
          ],

          [
            <Trophy size={32} />,
            "Submission",
            stats.submissions,
          ],

          [
            <Activity size={32} />,
            "Active",
            stats.activeQuiz,
          ],
        ].map((item, index) => (
          <div
            key={index}
            className="
            bg-[var(--surface)]
            border
            border-[var(--border)]
            rounded-3xl
            p-6
            shadow-xl
            hover:border-[var(--secondary)]
            transition
            "
          >
            <div className="text-[var(--secondary)]">
              {item[0]}
            </div>

            <h2
              className="
              text-4xl
              font-bold
              mt-4
              "
            >
              {item[2]}
            </h2>

            <p className="text-[var(--text-secondary)]">
              {item[1]}
            </p>
          </div>
        ))}
      </div>

      {/* QUICK ACCESS */}

      <div
        className="
        bg-[var(--surface)]
        border
        border-[var(--border)]
        rounded-3xl
        p-6
        shadow-xl
        "
      >
        <h2
          className="
          text-2xl
          font-bold
          mb-6
          "
        >
          Quick Access
        </h2>

        <div
          className="
          grid
          md:grid-cols-3
          lg:grid-cols-4
          gap-5
          "
        >
          {[
            {
              icon: <FileText size={40} />,
              title: "Quiz",
              desc: "Kelola quiz",
              path: "/admin/create-quiz",
            },

            {
              icon: <Ticket size={40} />,
              title: "Token",
              desc: "Generate token",
              path: "/admin/tokens",
            },

            {
              icon: <Trophy size={40} />,
              title: "Leaderboard",
              desc: "Ranking peserta",
              path: "/admin/leaderboard",
            },

            {
              icon: <Users size={40} />,
              title: "Participant",
              desc: "Data peserta",
              path: "/admin/participants",
            },

            {
              icon: <HelpCircle size={40} />,
              title: "Question",
              desc: "Kelola soal",
              path: "/admin/questions",
            },

            {
              icon: <Radio size={40} />,
              title: "Live Monitor",
              desc: "Pantau realtime",
              path: "/admin/live-monitor",
            },
          ].map((menu, index) => (
            <button
              key={index}
              onClick={() =>
                navigate(menu.path)
              }
              className="
              bg-[var(--background)]
              border
              border-[var(--border)]
              rounded-2xl
              p-5
              hover:scale-105
              hover:border-[var(--secondary)]
              hover:bg-[var(--surface-secondary)]
              transition
              text-left
              "
            >
              <div
                className="
                text-[var(--secondary)]
                mb-4
                "
              >
                {menu.icon}
              </div>

              <h2
                className="
                font-bold
                text-lg
                "
              >
                {menu.title}
              </h2>

              <p
                className="
                text-sm
                text-[var(--text-secondary)]
                mt-1
                "
              >
                {menu.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* SYSTEM STATUS */}

      <div
        className="
        mt-10
        bg-[var(--surface)]
        border
        border-[var(--border)]
        rounded-3xl
        p-6
        shadow-xl
        "
      >
        <h2
          className="
          text-xl
          font-bold
          mb-4
          "
        >
          System Status
        </h2>

        <div className="space-y-3 text-[var(--text-secondary)]">
          <div className="flex items-center gap-2">
            <Server
              size={16}
              className="text-[var(--secondary)]"
            />
            API Online
          </div>

          <div className="flex items-center gap-2">
            <Database
              size={16}
              className="text-[var(--secondary)]"
            />
            Database Connected
          </div>

          <div className="flex items-center gap-2">
            <Activity
              size={16}
              className="text-[var(--secondary)]"
            />
            Auto Refresh: 5 sec
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
