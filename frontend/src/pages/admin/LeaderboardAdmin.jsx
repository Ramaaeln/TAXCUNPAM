import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  ArrowLeft,
  Trophy,
  Users,
  Award,
  Download,
  Medal,
  Clock,
} from "lucide-react";

import api from "../../utils/api";
import useDocumentTitle from "../../hooks/useDocumentTitle";

export default function Leaderboard() {
  const navigate = useNavigate();
  useDocumentTitle("Leaderboard | TAXCUNPAM Admin");

  const [loading, setLoading] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");

  useEffect(() => {
    fetchQuizzes();
  }, []);

  useEffect(() => {
    if (!selectedQuiz) {
      setLeaderboard([]);
      return;
    }
    fetchLeaderboard(selectedQuiz);
  }, [selectedQuiz]);

  async function fetchQuizzes() {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await api.get("/admin/quizzes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setQuizzes(res.data.quizzes || []);
    } catch (err) {
      setMessageType("error");
      setMessage(err.response?.data?.message || "Gagal memuat daftar kuis");
    }
  }

  async function fetchLeaderboard(quizId) {
    try {
      setLoading(true);
      setMessage("");
      const res = await api.get(`/leaderboard/${quizId}`);
      setLeaderboard(res.data.leaderboard || []);
    } catch (err) {
      setMessageType("error");
      setMessage(err.response?.data?.message || "Gagal memuat peringkat");
    } finally {
      setLoading(false);
    }
  }

  const totalParticipants = leaderboard.length;
  const highestScore = leaderboard.length > 0 ? leaderboard[0].score : 0;
  const averageScore =
    leaderboard.length > 0
      ? (
          leaderboard.reduce((sum, item) => sum + item.score, 0) /
          leaderboard.length
        ).toFixed(1)
      : 0;

  // Helper formatting seconds to mm:ss
  function formatDuration(seconds) {
    if (!seconds) return "0s";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  function exportExcel() {
    if (!leaderboard.length) return;
    const data = leaderboard.map((item) => ({
      Rank: item.rank,
      Participant: item.participant_name,
      Score: item.score,
      "Duration (Seconds)": item.duration_seconds,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leaderboard");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const file = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(file, "leaderboard.xlsx");
  }

  function exportCSV() {
    if (!leaderboard.length) return;
    const data = leaderboard.map((item) => ({
      Rank: item.rank,
      Participant: item.participant_name,
      Score: item.score,
      "Duration (Seconds)": item.duration_seconds,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "leaderboard.csv");
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] antialiased px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* BACK ACTION */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center gap-2 bg-slate-800/40 border border-slate-800 hover:bg-slate-800 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 shadow-sm"
          >
            <ArrowLeft size={14} />
            Dashboard
          </button>
        </div>

        {/* HEADER */}
        <div className="mb-8">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-[var(--secondary)]">
              <Trophy size={24} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Leaderboard Peringkat</h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-1.5">
            Pantau dan analisis hasil perolehan nilai kompetisi ujian mahasiswa.
          </p>
        </div>

        {/* TOAST SYSTEM MESSAGE */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl border text-xs font-medium leading-relaxed animate-in fade-in duration-200 ${
              messageType === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/20 text-rose-400"
            }`}
          >
            {message}
          </div>
        )}

        {/* QUIZ PICKER FILTER */}
        <div className="bg-[var(--surface)] border border-slate-800/60 rounded-2xl p-5 shadow-md shadow-black/5 mb-8">
          <label className="block mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Pilih Paket Quiz Target
          </label>
          <select
            value={selectedQuiz}
            onChange={(e) => setSelectedQuiz(e.target.value)}
            className="w-full bg-[var(--background)] border border-slate-800/80 rounded-xl px-4 py-3 text-sm outline-none transition focus:border-indigo-500/50 cursor-pointer"
          >
            <option value="">== Pilih Kuis untuk Ditinjau ==</option>
            {quizzes.map((quiz) => (
              <option key={quiz.id} value={quiz.id}>
                {quiz.title}
              </option>
            ))}
          </select>
        </div>

        {/* ANALYTICS SUMMARY GRID */}
        {selectedQuiz && !loading && leaderboard.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8 animate-in fade-in slide-in-from-top-1 duration-300">
            {/* CARD 1 */}
            <div className="bg-[var(--surface)] border border-slate-800/60 rounded-2xl p-5 shadow-md shadow-black/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Total Peserta</p>
                <h2 className="text-2xl font-bold mt-1 tracking-tight">{totalParticipants} Orang</h2>
              </div>
              <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/5">
                <Users size={20} />
              </div>
            </div>

            {/* CARD 2 */}
            <div className="bg-[var(--surface)] border border-slate-800/60 rounded-2xl p-5 shadow-md shadow-black/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Skor Tertinggi</p>
                <h2 className="text-2xl font-bold mt-1 tracking-tight text-amber-400">{highestScore} pts</h2>
              </div>
              <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/5">
                <Trophy size={20} />
              </div>
            </div>

            {/* CARD 3 */}
            <div className="bg-[var(--surface)] border border-slate-800/60 rounded-2xl p-5 shadow-md shadow-black/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Rerata Nilai</p>
                <h2 className="text-2xl font-bold mt-1 tracking-tight text-indigo-400">{averageScore} pts</h2>
              </div>
              <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/5">
                <Award size={20} />
              </div>
            </div>
          </div>
        )}

        {/* MAIN RANKING GRID / TABLE HOLDER */}
        <div className="bg-[var(--surface)] border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl shadow-black/5">
          <div className="px-6 py-4 border-b border-slate-800/40 bg-slate-900/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-sm font-bold tracking-wider uppercase text-[var(--text-secondary)]">
              Tabel Peringkat Kelulusan
            </h2>

            {leaderboard.length > 0 && !loading && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={exportExcel}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--secondary)] hover:opacity-90 text-[var(--background)] text-xs font-bold transition shadow-sm"
                >
                  <Download size={14} />
                  Excel
                </button>

                <button
                  type="button"
                  onClick={exportCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                >
                  <Download size={14} />
                  CSV
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--background)] border-b border-slate-800/60 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  <th className="p-4 text-center w-20">Rank</th>
                  <th className="p-4">Participant Name</th>
                  <th className="p-4 w-32">Final Score</th>
                  <th className="p-4 w-40">Time Spent</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/40 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="p-12 text-center text-xs text-[var(--text-secondary)]">
                      <div className="flex justify-center items-center gap-2">
                        <div className="w-4 h-4 border-2 border-slate-700 border-t-[var(--secondary)] rounded-full animate-spin"></div>
                        <span>Mengkalkulasi urutan peringkat mahasiswa...</span>
                      </div>
                    </td>
                  </tr>
                ) : !selectedQuiz ? (
                  <tr>
                    <td colSpan="4" className="p-12 text-center text-xs text-amber-500/80 italic font-mono bg-amber-500/[0.01]">
                      💡 Silakan tentukan paket kuis terlebih dahulu untuk memuat ringkasan ranking.
                    </td>
                  </tr>
                ) : leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-12 text-center text-xs text-[var(--text-secondary)] italic">
                      Belum ada pengerjaan kuis yang tercatat untuk paket kuis ini.
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((item) => {
                    const isTop3 = item.rank <= 3;
                    const top3Styles = [
                      "bg-amber-500/10 text-amber-400 border-amber-500/20", // #1 Gold
                      "bg-slate-400/10 text-slate-300 border-slate-400/20",   // #2 Silver
                      "bg-orange-600/10 text-orange-400 border-orange-600/20", // #3 Bronze
                    ];

                    return (
                      <tr
                        key={item.participant_id}
                        className="hover:bg-slate-900/30 transition-colors"
                      >
                        {/* RANK COMPONENT */}
                        <td className="p-4 font-mono text-center">
                          {isTop3 ? (
                            <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full border text-[11px] font-bold ${top3Styles[item.rank - 1]}`}>
                              <Medal size={12} />
                              {item.rank}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs font-semibold">#{item.rank}</span>
                          )}
                        </td>

                        {/* NAME */}
                        <td className="p-4 font-medium text-[var(--text-primary)]">
                          {item.participant_name}
                        </td>

                        {/* SCORE */}
                        <td className="p-4 font-bold tracking-tight text-indigo-400">
                          {item.score} <span className="text-[10px] text-slate-600 font-normal">pts</span>
                        </td>

                        {/* TIME TAKEN */}
                        <td className="p-4 text-xs font-mono text-[var(--text-secondary)]">
                          <span className="inline-flex items-center gap-1">
                            <Clock size={12} className="opacity-40" />
                            {formatDuration(item.duration_seconds)}
                          </span>
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