import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  RotateCcw,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Search,
  ShieldAlert,
  Copy,
  UserCheck,
  Clock,
  RefreshCw,
  Users,
  AlertTriangle,
  Timer,
  X,
  HelpCircle,
} from "lucide-react";
import api from "../../utils/api";
import useDocumentTitle from "../../hooks/useDocumentTitle";

export default function RecoveryAdmin() {
  const navigate = useNavigate();
  useDocumentTitle("Recovery Management | UTCBT");

  const [loading, setLoading] = useState(false);
  const [resettingId, setResettingId] = useState(null);
  
  // Custom Toast State
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  
  const [quizzes, setQuizzes] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [generatedEmergencyToken, setGeneratedEmergencyToken] = useState("");
  const [currentTime, setCurrentTime] = useState(Date.now());

  // State Pilihan Sisa Menit Peserta { [attemptId]: 15 }
  const [customMinutesMap, setCustomMinutesMap] = useState({});

  // State Modal Konfirmasi Reset
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    attemptId: null,
    participantName: "",
    remainingMinutes: 15,
  });

  // Form Generate Token Darurat
  const [emergencyForm, setEmergencyForm] = useState({
    quizId: "",
    expiryHours: 2,
    maxUsage: 1,
  });

  // Helper untuk menampilkan toast dengan durasi otomatis
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  // Timer interval untuk memperbarui hitung mundur sisa waktu setiap detik
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchQuizzes = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await api.get("/admin/quizzes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuizzes(res.data.quizzes || []);
    } catch {
      showToast("Gagal memuat daftar kuis.", "error");
    }
  };

  const fetchParticipants = useCallback(async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await api.get("/admin/live-monitor", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = res.data.participants || [];
      setParticipants(list);

      // Set default nilai input menit recovery ke 15 menit
      setCustomMinutesMap((prev) => {
        const initial = { ...prev };
        list.forEach((p) => {
          if (initial[p.id] === undefined) {
            initial[p.id] = 15;
          }
        });
        return initial;
      });
    } catch {
      console.error("Gagal memuat daftar peserta.");
    }
  }, []);

  useEffect(() => {
    fetchQuizzes();
    fetchParticipants();
  }, [fetchParticipants]);

  // Kalkulasi sisa waktu berdasarkan started_at & durasi kuis
  function getRemainingTime(startedAt, durationMinutes) {
    if (!startedAt || !durationMinutes) return { label: "-", isExpired: false };

    const start = new Date(startedAt).getTime();
    const durationMs = durationMinutes * 60 * 1000;
    const endTime = start + durationMs;
    const diffMs = endTime - currentTime;

    if (diffMs <= 0) {
      return { label: "Waktu Habis", isExpired: true };
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return {
      label: `${minutes}m ${seconds < 10 ? "0" : ""}${seconds}s tersisa`,
      isExpired: false,
    };
  }

  // Handler ubah nilai menit untuk peserta tertentu
  const handleMinuteChange = (attemptId, val) => {
    setCustomMinutesMap((prev) => ({
      ...prev,
      [attemptId]: val,
    }));
  };

  // 1. Membuka Modal Konfirmasi Reset
  const triggerResetModal = (attemptId, participantName) => {
    const remainingMins = Number(customMinutesMap[attemptId]);

    if (isNaN(remainingMins) || remainingMins <= 0) {
      showToast("Masukkan jumlah menit recovery yang valid (> 0).", "error");
      return;
    }

    setConfirmModal({
      show: true,
      attemptId,
      participantName,
      remainingMinutes: remainingMins,
    });
  };

  // 2. Eksekusi Reset Session dari Modal
  async function executeResetSession() {
    const { attemptId, participantName, remainingMinutes } = confirmModal;
    if (!attemptId) return;

    try {
      setResettingId(attemptId);
      setConfirmModal({ show: false, attemptId: null, participantName: "", remainingMinutes: 15 });

      const token = localStorage.getItem("adminToken");

      const res = await api.post(
        "/admin/reset-session",
        {
          attemptId,
          customRemainingMinutes: remainingMinutes,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast(
        res.data.message ||
          `Sesi "${participantName}" berhasil di-reset dengan sisa waktu ${remainingMinutes} menit!`,
        "success"
      );

      await fetchParticipants();
    } catch (err) {
      showToast(err.response?.data?.message || "Gagal me-reset sesi peserta.", "error");
    } finally {
      setResettingId(null);
    }
  }

  // 3. Eksekusi Generate Emergency Token
  async function handleGenerateEmergencyToken(e) {
    e.preventDefault();
    if (!emergencyForm.quizId) {
      showToast("Pilih kuis terlebih dahulu.", "error");
      return;
    }

    try {
      setLoading(true);
      setGeneratedEmergencyToken("");
      const token = localStorage.getItem("adminToken");

      const res = await api.post(
        "/admin/generate-token",
        {
          quiz_id: emergencyForm.quizId,
          count: 1,
          expires_in_minutes: Number(emergencyForm.expiryHours) * 60,
          max_usage: Number(emergencyForm.maxUsage),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.tokens && res.data.tokens.length > 0) {
        setGeneratedEmergencyToken(res.data.tokens[0].token);
        showToast("Token darurat pemulihan berhasil dibuat!", "success");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Gagal membuat token darurat.", "error");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    showToast("Token berhasil disalin ke clipboard!", "success");
  }

  // Filter pencarian peserta
  const filteredParticipants = participants.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      (p.participant_name && p.participant_name.toLowerCase().includes(q)) ||
      (p.quizzes?.title && p.quizzes.title.toLowerCase().includes(q)) ||
      (p.status && p.status.toLowerCase().includes(q)) ||
      (p.id && p.id.toLowerCase().includes(q))
    );
  });

  const problematicCount = participants.filter((p) =>
    ["disqualified", "auto_submitted", "timeout"].includes(p.status)
  ).length;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] antialiased px-4 py-8 sm:px-6 lg:px-8 relative">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* TOP BAR ACTION */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => navigate("/utcbt-internal/dashboard")}
            className="flex items-center gap-2 bg-slate-800/40 border border-slate-800 hover:bg-slate-800 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 shadow-sm cursor-pointer"
          >
            <ArrowLeft size={14} />
            Kembali ke Dashboard
          </button>

          <button
            type="button"
            onClick={fetchParticipants}
            className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-400 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Sinkronkan Data</span>
          </button>
        </div>

        {/* TITLE HEADER */}
        <div className="bg-[var(--surface)] border border-slate-800/60 rounded-2xl p-6 sm:p-8 shadow-xl shadow-black/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 shrink-0">
                <ShieldAlert size={26} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Recovery & Emergency Control
                </h1>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                  Pusat penanganan kendala teknis, reset status pengerjaan, dan atur sisa waktu kuis.
                </p>
              </div>
            </div>

            {/* QUICK STATS CHIPS */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 px-3.5 py-2 rounded-xl text-xs font-medium">
                <Users size={14} className="text-slate-400" />
                <span className="text-[var(--text-secondary)]">Total:</span>
                <span className="font-bold text-[var(--text-primary)]">
                  {participants.length}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 px-3.5 py-2 rounded-xl text-xs font-medium text-rose-400">
                <AlertTriangle size={14} />
                <span>Bermasalah:</span>
                <span className="font-extrabold">{problematicCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* WORKSPACE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* PANEL 1: CARI & RESET PESERTA */}
          <div className="lg:col-span-2 bg-[var(--surface)] border border-slate-800/60 rounded-2xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/40">
              <div className="flex items-center gap-2">
                <RotateCcw size={18} className="text-indigo-400" />
                <h2 className="font-bold text-base">Pemulihan Sesi Peserta</h2>
              </div>
              <span className="text-[11px] text-[var(--text-secondary)]">
                Menampilkan {filteredParticipants.length} data
              </span>
            </div>

            {/* INPUT CARI */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                placeholder="Cari berdasarkan nama, kuis, atau status (mis: disqualified)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--background)] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-indigo-500/50 transition-all"
              />
            </div>

            {/* LIST PESERTA MONITOR */}
            <div className="max-h-[520px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {filteredParticipants.length === 0 ? (
                <div className="text-center py-12 text-xs text-[var(--text-secondary)] border border-dashed border-slate-800 rounded-xl">
                  {searchQuery
                    ? "Peserta tidak ditemukan."
                    : "Tidak ada data pengerjaan peserta."}
                </div>
              ) : (
                filteredParticipants.map((p) => {
                  const isProblematic = [
                    "disqualified",
                    "auto_submitted",
                    "timeout",
                  ].includes(p.status);
                  const durationMinutes = p.quizzes?.duration_minutes || 60;
                  const remaining = getRemainingTime(
                    p.started_at,
                    durationMinutes
                  );
                  const currentMinsInput = customMinutesMap[p.id] ?? 15;

                  return (
                    <div
                      key={p.id}
                      className="p-4 bg-[var(--background)] border border-slate-800/80 hover:border-slate-700/80 rounded-xl transition-all space-y-3 shadow-sm"
                    >
                      {/* NAMA & STATUS */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">
                              {p.participant_name || "Peserta Tanpa Nama"}
                            </span>

                            <span
                              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-wider border ${
                                p.status === "in_progress"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : isProblematic
                                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                  : "bg-slate-800 text-slate-400 border-slate-700"
                              }`}
                            >
                              {p.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-[var(--text-secondary)] flex-wrap">
                            <span>
                              Kuis:{" "}
                              <strong className="text-[var(--text-primary)]">
                                {p.quizzes?.title || "-"}
                              </strong>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock
                                size={12}
                                className={
                                  remaining.isExpired
                                    ? "text-rose-400"
                                    : "text-amber-400"
                                }
                              />
                              <strong
                                className={
                                  remaining.isExpired
                                    ? "text-rose-400"
                                    : "text-amber-400"
                                }
                              >
                                {remaining.label}
                              </strong>
                            </span>
                            {p.violation_count > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-rose-400 font-semibold">
                                  Pelanggaran: {p.violation_count}x
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* PANEL RECOVERY WAKTU & RESET */}
                      <div className="pt-3 border-t border-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-lg">
                            <Timer size={13} className="text-amber-400" />
                            <span className="text-[11px] text-slate-400 font-medium">
                              Sisa Waktu:
                            </span>
                            <input
                              type="number"
                              min="1"
                              max={durationMinutes}
                              value={currentMinsInput}
                              onChange={(e) =>
                                handleMinuteChange(p.id, e.target.value)
                              }
                              className="w-12 bg-slate-800 border border-slate-700 rounded text-center text-xs font-bold text-amber-400 py-0.5 outline-none focus:border-amber-400"
                            />
                            <span className="text-[11px] text-slate-400 font-medium">
                              Mnt
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {[5, 10, 15, 30].map((mins) => (
                              <button
                                key={mins}
                                type="button"
                                onClick={() => handleMinuteChange(p.id, mins)}
                                className={`px-2 py-1 rounded text-[10px] font-bold border transition cursor-pointer ${
                                  Number(currentMinsInput) === mins
                                    ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                                    : "bg-slate-800/60 border-slate-800 text-slate-400 hover:bg-slate-800"
                                }`}
                              >
                                {mins}m
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() =>
                                handleMinuteChange(p.id, durationMinutes)
                              }
                              className={`px-2 py-1 rounded text-[10px] font-bold border transition cursor-pointer ${
                                Number(currentMinsInput) === durationMinutes
                                  ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                                  : "bg-slate-800/60 border-slate-800 text-slate-400 hover:bg-slate-800"
                              }`}
                            >
                              Full ({durationMinutes}m)
                            </button>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={resettingId === p.id}
                          onClick={() => triggerResetModal(p.id, p.participant_name)}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500 hover:text-white text-indigo-400 text-xs font-bold transition disabled:opacity-50 shrink-0 cursor-pointer w-full sm:w-auto"
                        >
                          {resettingId === p.id ? (
                            <RefreshCw size={13} className="animate-spin" />
                          ) : (
                            <UserCheck size={14} />
                          )}
                          <span>
                            {resettingId === p.id
                              ? "Memproses..."
                              : `Reset Sesi (${currentMinsInput}m)`}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* PANEL 2: GENERATE TOKEN DARURAT */}
          <div className="bg-[var(--surface)] border border-slate-800/60 rounded-2xl p-6 shadow-md flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800/40">
                <KeyRound size={18} className="text-amber-400" />
                <h2 className="font-bold text-base">Token Darurat Ujian</h2>
              </div>

              <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed">
                Buat token darurat khusus bagi peserta yang membutuhkan kode
                akses baru untuk masuk ke lembar ujian.
              </p>

              <form
                onSubmit={handleGenerateEmergencyToken}
                className="space-y-4"
              >
                <div>
                  <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Target Paket Kuis
                  </label>
                  <select
                    value={emergencyForm.quizId}
                    onChange={(e) =>
                      setEmergencyForm({
                        ...emergencyForm,
                        quizId: e.target.value,
                      })
                    }
                    className="w-full bg-[var(--background)] border border-slate-800 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-indigo-500/50 cursor-pointer"
                    required
                  >
                    <option value="">== Pilih Paket Kuis ==</option>
                    {quizzes.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      Masa Berlaku (Jam)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={emergencyForm.expiryHours}
                      onChange={(e) =>
                        setEmergencyForm({
                          ...emergencyForm,
                          expiryHours: e.target.value,
                        })
                      }
                      className="w-full bg-[var(--background)] border border-slate-800 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500/50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      Maks Guna
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={emergencyForm.maxUsage}
                      onChange={(e) =>
                        setEmergencyForm({
                          ...emergencyForm,
                          maxUsage: e.target.value,
                        })
                      }
                      className="w-full bg-[var(--background)] border border-slate-800 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500/50"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500 hover:text-white text-amber-400 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Memproses..." : "Generate Token Darurat"}
                </button>
              </form>

              {/* TAMPILAN TOKEN YANG BERHASIL DIGENERATE */}
              {generatedEmergencyToken && (
                <div className="mt-4 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-2 animate-in fade-in duration-200">
                  <span className="font-mono text-sm font-extrabold text-amber-400 tracking-wider">
                    {generatedEmergencyToken}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generatedEmergencyToken)}
                    className="flex items-center gap-1 text-xs bg-amber-500 text-slate-950 font-bold px-2.5 py-1 rounded-lg hover:bg-amber-400 transition shrink-0 cursor-pointer"
                  >
                    <Copy size={12} />
                    Salin
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL KONFIRMASI RESET (CUSTOM DIALOG)     */}
      {/* ========================================== */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--surface)] border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <HelpCircle size={20} />
                <h3 className="font-bold text-base text-[var(--text-primary)]">
                  Konfirmasi Reset Sesi
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              <p>
                Anda akan me-reset status kuis peserta{" "}
                <strong className="text-[var(--text-primary)]">
                  "{confirmModal.participantName}"
                </strong>
                .
              </p>
              
              <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Status Baru:</span>
                  <span className="font-bold text-emerald-400 uppercase">in_progress</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Alokasi Sisa Waktu:</span>
                  <span className="font-extrabold text-amber-400">
                    {confirmModal.remainingMinutes} Menit
                  </span>
                </div>
              </div>

              <p className="text-[11px] opacity-80">
                Setelah di-reset, seluruh riwayat pelanggaran akan dibersihkan dan peserta dapat masuk kembali untuk melanjutkan pengerjaan.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                className="flex-1 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-xs font-bold text-slate-300 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeResetSession}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                Ya, Reset Sesi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TOAST NOTIFICATION (AUTO DISMISS)          */}
      {/* ========================================== */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-in slide-in-from-bottom-5 duration-300">
          <div
            className={`flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md ${
              toast.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-300"
                : "bg-rose-950/90 border-rose-500/30 text-rose-300"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-400" />
            ) : (
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-400" />
            )}
            <div className="flex-1 text-xs font-medium leading-relaxed pr-2">
              {toast.message}
            </div>
            <button
              type="button"
              onClick={() => setToast((prev) => ({ ...prev, show: false }))}
              className="text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}