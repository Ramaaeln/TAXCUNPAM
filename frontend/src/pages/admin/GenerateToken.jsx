import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  ArrowLeft,
  Save,
  Ticket,
  Copy,
  CheckCircle2,
  AlertCircle,
  Download,
} from "lucide-react";
import useDocumentTitle from "../../hooks/useDocumentTitle";

export default function GenerateToken() {
  const navigate = useNavigate();
  useDocumentTitle("Generate Token | TAXCUNPAM Admin");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [loading, setLoading] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [tokens, setTokens] = useState([]);

  const [form, setForm] = useState({
    quiz_id: "",
    count: 1,
    expires_in_minutes: 1440,
  });

  useEffect(() => {
    fetchQuizzes();
  }, []);

  async function fetchQuizzes() {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await api.get("/admin/quizzes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setQuizzes(res.data.quizzes || []);
    } catch {
      setMessageType("error");
      setMessage("Gagal memuat daftar kuis");
    }
  }

  async function handleGenerate(e) {
    e.preventDefault();
    if (!form.quiz_id) {
      setMessageType("error");
      setMessage("Silakan pilih kuis terlebih dahulu.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      const token = localStorage.getItem("adminToken");

      const res = await api.post("/admin/generate-token", form, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTokens(res.data.tokens || []);
      setMessageType("success");
      setMessage(`${res.data.tokens?.length || 0} token berhasil dibuat`);
    } catch (err) {
      setMessageType("error");
      setMessage(err.response?.data?.message || "Gagal membuat token");
    } finally {
      setLoading(false);
    }
  }

  function copyToken(token) {
    navigator.clipboard.writeText(token);
    setMessageType("success");
    setMessage("Token berhasil disalin ke clipboard");
  }

  async function copyAllTokens() {
    try {
      const allTokens = tokens.map((item) => item.token).join("\n");
      await navigator.clipboard.writeText(allTokens);
      setMessageType("success");
      setMessage(`${tokens.length} token berhasil disalin sekaligus`);
    } catch {
      setMessageType("error");
      setMessage("Gagal menyalin semua token");
    }
  }

  function downloadCSV() {
    try {
      const csvContent = [
        ["No", "Token"],
        ...tokens.map((item, index) => [index + 1, item.token]),
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      saveAs(blob, "quiz-tokens.csv");
      setMessageType("success");
      setMessage("Berkas CSV berhasil diunduh");
    } catch {
      setMessageType("error");
      setMessage("Gagal mengunduh file CSV");
    }
  }

  async function downloadExcel() {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Tokens");

      worksheet.columns = [
        { header: "No", key: "no", width: 10 },
        { header: "Token", key: "token", width: 40 },
      ];

      tokens.forEach((item, index) => {
        worksheet.addRow({
          no: index + 1,
          token: item.token,
        });
      });

      worksheet.getRow(1).font = { bold: true };
      const buffer = await workbook.xlsx.writeBuffer();

      saveAs(new Blob([buffer]), "quiz-tokens.xlsx");
      setMessageType("success");
      setMessage("Berkas Excel berhasil diunduh");
    } catch {
      setMessageType("error");
      setMessage("Gagal mengunduh file Excel");
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] antialiased px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* BACK ACTION BUTTON */}
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

        {/* CONTAINER BOX */}
        <div className="bg-[var(--surface)] border border-slate-800/60 rounded-2xl p-6 sm:p-8 shadow-xl shadow-black/5">
          
          {/* HEADER */}
          <div className="mb-8 pb-6 border-b border-slate-800/40">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/10 rounded-xl text-[var(--secondary)]">
                <Ticket size={24} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Generate Token</h1>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mt-1.5">
              Buat token akses unik berkala agar peserta valid dapat mengikuti ujian kuis.
            </p>
          </div>

          {/* NOTIFICATION TOAST */}
          {message && (
            <div
              className={`mb-6 flex items-start gap-3 p-4 rounded-xl border animate-in fade-in slide-in-from-top-1 duration-200 ${
                messageType === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-400"
              }`}
            >
              {messageType === "success" ? (
                <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
              )}
              <span className="text-xs font-medium leading-relaxed">{message}</span>
            </div>
          )}

          {/* SETUP FORM */}
          <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* INPUT PACKET QUIZ */}
            <div className="md:col-span-2">
              <label className="block mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Target Paket Kuis
              </label>
              <select
                value={form.quiz_id}
                onChange={(e) => setForm({ ...form, quiz_id: e.target.value })}
                className="w-full bg-[var(--background)] border border-slate-800/80 rounded-xl px-4 py-3 text-sm outline-none transition focus:border-indigo-500/50 cursor-pointer"
                required
              >
                <option value="">== Pilih Paket Ujian ==</option>
                {quizzes.map((quiz) => (
                  <option key={quiz.id} value={quiz.id}>
                    {quiz.title}
                  </option>
                ))}
              </select>
            </div>

            {/* INPUT TOKEN QUANTITY */}
            <div>
              <label className="block mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Jumlah Generator Token
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={form.count}
                onChange={(e) => setForm({ ...form, count: Number(e.target.value) })}
                className="w-full bg-[var(--background)] border border-slate-800/80 rounded-xl px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500/50"
                required
              />
            </div>

            {/* INPUT EXPIRE TIME */}
            <div>
              <label className="block mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Masa Kadaluarsa (Menit)
              </label>
              <input
                type="number"
                min="5"
                value={form.expires_in_minutes}
                onChange={(e) => setForm({ ...form, expires_in_minutes: Number(e.target.value) })}
                className="w-full bg-[var(--background)] border border-slate-800/80 rounded-xl px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500/50"
                required
              />
            </div>

            {/* GENERATE CONTROLLER BUTTON */}
            <div className="md:col-span-2 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3.5 rounded-xl bg-[var(--secondary)] hover:opacity-95 text-[var(--background)] font-extrabold text-sm shadow-md transition-all duration-300 disabled:opacity-50"
              >
                {loading ? "Memproses Pembuatan..." : "Mulai Generate Kunci Akses"}
              </button>
            </div>
          </form>

          {/* OUTPUT CONTAINER: GENERATED TOKENS SECTION */}
          {tokens.length > 0 && (
            <div className="mt-10 pt-8 border-t border-slate-800/60 animate-in fade-in duration-300">
              
              {/* SUBSECTION ACTION CONTROLS */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Generated Tokens</h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Ditemukan {tokens.length} pasang kunci ujian aktif.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={copyAllTokens}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold hover:bg-indigo-500 hover:text-white transition-all duration-200"
                  >
                    <Copy size={14} />
                    Salin Semua
                  </button>

                  <button
                    type="button"
                    onClick={downloadCSV}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-800 transition"
                  >
                    <Download size={14} />
                    CSV
                  </button>

                  <button
                    type="button"
                    onClick={downloadExcel}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-800 transition"
                  >
                    <Save size={14} />
                    Excel
                  </button>
                </div>
              </div>

              {/* LIST TOKEN CELLS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                {tokens.map((token, idx) => (
                  <div
                    key={token.id || idx}
                    className="group bg-[var(--background)] border border-slate-800/60 rounded-xl p-4 flex items-center justify-between gap-3 hover:border-slate-700 transition"
                  >
                    <div className="min-w-0 flex items-center gap-2.5">
                      <span className="text-[10px] font-mono text-slate-600 bg-slate-900 px-1.5 py-0.5 rounded">
                        {idx + 1}
                      </span>
                      <p className="font-mono text-sm font-bold tracking-wider text-slate-200 truncate group-hover:text-indigo-400 transition-colors">
                        {token.token}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => copyToken(token.token)}
                      className="p-2 text-slate-500 hover:text-[var(--secondary)] hover:bg-slate-800/50 rounded-lg transition"
                      title="Salin token tunggal"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}