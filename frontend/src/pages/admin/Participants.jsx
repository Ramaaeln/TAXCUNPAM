import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Users,
  Search,
  Download,
  Trophy,
  Eye,
  AlertTriangle,
} from "lucide-react";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import api from "../../utils/api";
import useDocumentTitle from "../../hooks/useDocumentTitle";

export default function Participants() {
  const navigate = useNavigate();
  useDocumentTitle("Participants | TAXCUNPAM Admin");

  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchParticipants();
  }, []);

  async function fetchParticipants() {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await api.get("/admin/live-monitor", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setParticipants(res.data.participants || []);
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Failed to load participants"
      );
    } finally {
      setLoading(false);
    }
  }

  const totalParticipants = participants.length;
  const submitted = participants.filter((p) => p.status === "submitted").length;
  const active = participants.filter((p) => p.status === "in_progress").length;

  const filteredParticipants = participants.filter((p) =>
    p.participant_name?.toLowerCase().includes(search.toLowerCase())
  );

  function exportExcel() {
    const data = participants.map((p) => ({
      Participant: p.participant_name,
      Quiz: p.quizzes?.title,
      Status: p.status,
      Score: p.score,
      Violations: p.violation_count,
      Devtools: p.devtools_violations,
      Fullscreen: p.fullscreen_violations,
      TabSwitch: p.tab_switch_violations,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Participants");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const file = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(file, "participants.xlsx");
  }

  function exportCSV() {
    const data = filteredParticipants.map((p) => ({
      Participant: p.participant_name,
      Quiz: p.quizzes?.title,
      Status: p.status,
      Score: p.score,
      Violations: p.violation_count,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    saveAs(blob, "participants.csv");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center text-[var(--text-secondary)] antialiased">
        <div className="w-12 h-12 border-4 border-slate-800 border-t-[var(--secondary)] rounded-full animate-spin mb-4" />
        <p className="text-base font-bold tracking-tight text-[var(--text-primary)]">Loading...</p>
        <p className="text-xs text-[var(--text-secondary)] mt-1">Memuat basis data peserta...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] antialiased px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* BACK ACTION */}
        <div className="mb-6">
          <button
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
              <Users size={24} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Participants Data</h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-1.5">
            Kelola data mahasiswa, tinjau hasil nilai, serta pantau catatan integritas ujian.
          </p>
        </div>

        {/* ERROR MESSAGE NOTIFICATION */}
        {message && (
          <div className="mb-6 p-4 rounded-xl border text-xs font-medium bg-rose-500/10 border-rose-500/20 text-rose-400">
            {message}
          </div>
        )}

        {/* ANALYTICS STATS METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="bg-[var(--surface)] border border-slate-800/60 rounded-2xl p-5 shadow-md shadow-black/5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Total Register</p>
              <h2 className="text-2xl font-bold mt-1 tracking-tight">{totalParticipants} Orang</h2>
            </div>
            <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/5">
              <Users size={20} />
            </div>
          </div>

          <div className="bg-[var(--surface)] border border-slate-800/60 rounded-2xl p-5 shadow-md shadow-black/5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Selesai Mengerjakan</p>
              <h2 className="text-2xl font-bold mt-1 tracking-tight text-emerald-400">{submitted} Orang</h2>
            </div>
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/5">
              <Trophy size={20} />
            </div>
          </div>

          <div className="bg-[var(--surface)] border border-slate-800/60 rounded-2xl p-5 shadow-md shadow-black/5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Sedang Ujian</p>
              <h2 className="text-2xl font-bold mt-1 tracking-tight text-amber-400">{active} Orang</h2>
            </div>
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/5">
              <Users size={20} />
            </div>
          </div>
        </div>

        {/* UTILITIES FILTER AND EXPORTBAR */}
        <div className="bg-[var(--surface)] border border-slate-800/60 rounded-2xl p-5 shadow-md shadow-black/5 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
            
            {/* SEARCH CONTROLLER */}
            <div className="relative flex-1 group">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] transition-colors group-focus-within:text-indigo-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama peserta kuis..."
                className="w-full bg-[var(--background)] border border-slate-800/80 rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-500/50"
              />
            </div>

            {/* DOWNLOAD EXPORTERS */}
            <div className="flex gap-2">
              <button
                onClick={exportExcel}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--secondary)] hover:opacity-90 text-[var(--background)] text-xs font-bold transition shadow-sm"
              >
                <Download size={14} />
                Excel
              </button>

              <button
                onClick={exportCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
              >
                <Download size={14} />
                CSV
              </button>
            </div>
          </div>
        </div>

        {/* CONTAINER TABLE GRID */}
        <div className="bg-[var(--surface)] border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl shadow-black/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--background)] border-b border-slate-800/60 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  <th className="p-4">Participant Name</th>
                  <th className="p-4">Quiz Package</th>
                  <th className="p-4 w-32">Live Status</th>
                  <th className="p-4 w-28 text-center">Final Score</th>
                  <th className="p-4 w-32 text-center">Violations</th>
                  <th className="p-4 w-36 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/40 text-sm">
                {filteredParticipants.map((participant) => {
                  const hasViolations = (participant.violation_count || 0) > 0;
                  return (
                    <tr
                      key={participant.id}
                      className={`hover:bg-slate-900/30 transition-colors ${hasViolations ? "bg-rose-500/[0.01]" : ""}`}
                    >
                      {/* PARTICIPANT NAME */}
                      <td className="p-4 font-semibold text-[var(--text-primary)] whitespace-nowrap">
                        {participant.participant_name}
                      </td>

                      {/* TARGET QUIZ */}
                      <td className="p-4 text-xs text-[var(--text-secondary)] max-w-xs truncate">
                        {participant.quizzes?.title || "N/A"}
                      </td>

                      {/* BADGE ACCESS STATUS */}
                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            participant.status === "submitted"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {participant.status === "in_progress" && (
                            <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse mr-0.5" />
                          )}
                          {participant.status === "in_progress" ? "In Progress" : "Submitted"}
                        </span>
                      </td>

                      {/* CALCULATED FINAL SCORE */}
                      <td className="p-4 font-bold text-center text-indigo-400 font-mono">
                        {participant.score ?? 0}
                      </td>

                      {/* TOTAL ACCUMULATED VIOLATIONS */}
                      <td className={`p-4 text-center font-mono font-bold ${hasViolations ? "text-rose-400 bg-rose-500/5" : "text-slate-600"}`}>
                        {hasViolations ? (
                          <span className="inline-flex items-center gap-1 justify-center">
                            <AlertTriangle size={12} />
                            {participant.violation_count}
                          </span>
                        ) : (
                          0
                        )}
                      </td>

                      {/* DRILL ACTIONS ROW */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/admin/review-answers/${participant.id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-indigo-400 hover:border-indigo-500/30 transition-all shadow-sm"
                        >
                          <Eye size={12} />
                          Cek Jawaban
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredParticipants.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-xs text-[var(--text-secondary)] italic">
                      Tidak ada data peserta kuis yang cocok dengan kata kunci pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}