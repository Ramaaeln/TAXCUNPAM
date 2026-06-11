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

      const res = await api.get(
        "/admin/quizzes",

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setQuizzes(res.data.quizzes);
    } catch {
      setMessageType("error");

      setMessage("Gagal memuat quiz");
    }
  }

  async function handleGenerate(e) {
    e.preventDefault();

    try {
      setLoading(true);

      const token = localStorage.getItem("adminToken");

      const res = await api.post(
        "/admin/generate-token",

        form,

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setTokens(res.data.tokens);
      setMessageType("success");

      setMessage(`${res.data.tokens.length} token berhasil dibuat`);
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

    setMessage("Token berhasil disalin");
  }
async function copyAllTokens() {
  try {
    const allTokens = tokens
      .map((item) => item.token)
      .join("\n");

    await navigator.clipboard.writeText(allTokens);

    setMessageType("success");
    setMessage(
      `${tokens.length} token berhasil disalin`
    );
  } catch {
    setMessageType("error");
    setMessage("Gagal menyalin token");
  }
}
function downloadCSV() {
  try {
    const csvContent = [
      ["No", "Token"],
      ...tokens.map((item, index) => [
        index + 1,
        item.token,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob(
      [csvContent],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    saveAs(blob, "quiz-tokens.csv");

    setMessageType("success");
    setMessage("CSV berhasil diunduh");
  } catch {
    setMessageType("error");
    setMessage("Gagal download CSV");
  }
}

async function downloadExcel() {
  try {
    const workbook = new ExcelJS.Workbook();

    const worksheet =
      workbook.addWorksheet("Tokens");

    worksheet.columns = [
      {
        header: "No",
        key: "no",
        width: 10,
      },
      {
        header: "Token",
        key: "token",
        width: 40,
      },
    ];

    tokens.forEach((item, index) => {
      worksheet.addRow({
        no: index + 1,
        token: item.token,
      });
    });

    worksheet.getRow(1).font = {
      bold: true,
    };

    const buffer =
      await workbook.xlsx.writeBuffer();

    saveAs(
      new Blob([buffer]),
      "quiz-tokens.xlsx"
    );

    setMessageType("success");
    setMessage("Excel berhasil diunduh");
  } catch {
    setMessageType("error");
    setMessage("Gagal download Excel");
  }
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
    <div
      className="
      max-w-4xl
      mx-auto
      bg-[var(--surface)]
      border
      border-[var(--border)]
      rounded-3xl
      p-8
      shadow-xl
      "
    >
      {/* BACK BUTTON */}

      <button
        type="button"
        onClick={() =>
          navigate("/admin/dashboard")
        }
        className="
        mb-6
        flex
        items-center
        gap-2
        px-4
        py-2
        rounded-xl
        bg-[var(--surface-secondary)]
        border
        border-[var(--border)]
        hover:bg-[var(--primary)]
        transition
        "
      >
        <ArrowLeft size={18} />
        Dashboard
      </button>

      {/* HEADER */}

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Ticket
            size={32}
            className="text-[var(--secondary)]"
          />

          <h1 className="text-4xl font-bold">
            Generate Token
          </h1>
        </div>

        <p className="text-[var(--text-secondary)]">
          Buat token peserta quiz
        </p>
      </div>

      {/* MESSAGE */}

      {message && (
        <div
          className={`
          mb-6
          flex
          items-center
          gap-3
          p-4
          rounded-2xl
          border

          ${
            messageType === "success"
              ? "bg-[var(--secondary)]/10 border-[var(--secondary)]/20 text-[var(--secondary)]"
              : "bg-[var(--danger)]/10 border-[var(--danger)]/20 text-[var(--danger)]"
          }
          `}
        >
          {messageType ===
          "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}

          <span>{message}</span>
        </div>
      )}

      {/* FORM */}

      <form
        onSubmit={handleGenerate}
        className="space-y-5"
      >
        {/* QUIZ */}

        <div>
          <label
            className="
            block
            mb-2
            text-sm
            text-[var(--text-secondary)]
            "
          >
            Quiz
          </label>

          <select
            value={form.quiz_id}
            onChange={(e) =>
              setForm({
                ...form,
                quiz_id:
                  e.target.value,
              })
            }
            className="
            w-full
            bg-[var(--background)]
            border
            border-[var(--border)]
            rounded-xl
            p-4
            outline-none
            focus:border-[var(--secondary)]
            "
          >
            <option value="">
              Pilih Quiz
            </option>

            {quizzes.map(
              (quiz) => (
                <option
                  key={quiz.id}
                  value={quiz.id}
                >
                  {quiz.title}
                </option>
              )
            )}
          </select>
        </div>

        {/* COUNT */}

        <div>
          <label
            className="
            block
            mb-2
            text-sm
            text-[var(--text-secondary)]
            "
          >
            Jumlah Token
          </label>

          <input
            type="number"
            min="1"
            value={form.count}
            onChange={(e) =>
              setForm({
                ...form,
                count: Number(
                  e.target.value
                ),
              })
            }
            className="
            w-full
            bg-[var(--background)]
            border
            border-[var(--border)]
            rounded-xl
            p-4
            outline-none
            focus:border-[var(--secondary)]
            "
          />
        </div>

        {/* EXPIRED */}

        <div>
          <label
            className="
            block
            mb-2
            text-sm
            text-[var(--text-secondary)]
            "
          >
            Masa Berlaku
            (Menit)
          </label>

          <input
            type="number"
            min="1"
            value={
              form.expires_in_minutes
            }
            onChange={(e) =>
              setForm({
                ...form,
                expires_in_minutes:
                  Number(
                    e.target.value
                  ),
              })
            }
            className="
            w-full
            bg-[var(--background)]
            border
            border-[var(--border)]
            rounded-xl
            p-4
            outline-none
            focus:border-[var(--secondary)]
            "
          />
        </div>

        {/* SUBMIT */}

        <button
          disabled={loading}
          className="
          w-full
          bg-[var(--secondary)]
          hover:bg-[var(--accent)]
          text-[var(--background)]
          rounded-xl
          py-4
          font-bold
          shadow-lg
          hover:shadow-[0_0_25px_rgba(212,162,76,0.25)]
          transition-all
          duration-300
          disabled:opacity-50
          disabled:cursor-not-allowed
          "
        >
          {loading
            ? "Generating..."
            : "Generate Tokens"}
        </button>
      </form>

      {/* GENERATED TOKENS */}

      {tokens.length > 0 && (
        <div
          className="
          mt-10
          pt-8
          border-t
          border-[var(--border)]
          "
        >
          <div
  className="
  flex
  flex-col
  md:flex-row
  md:items-center
  md:justify-between
  gap-4
  mb-5
  "
>
  <div>
    <h2 className="text-2xl font-bold">
      Generated Tokens
    </h2>

    <span
      className="
      text-sm
      text-[var(--text-secondary)]
      "
    >
      {tokens.length} token
    </span>
  </div>

  <div className="flex flex-wrap gap-3">
    <button
      type="button"
      onClick={copyAllTokens}
      className="
      flex
      items-center
      gap-2
      px-4
      py-2
      rounded-xl
      bg-[var(--secondary)]
      text-[var(--background)]
      hover:bg-[var(--accent)]
      transition
      "
    >
      <Copy size={16} />
      Copy All
    </button>

    <button
      type="button"
      onClick={downloadCSV}
      className="
      flex
      items-center
      gap-2
      px-4
      py-2
      rounded-xl
      border
      border-[var(--border)]
      hover:bg-[var(--surface-secondary)]
      transition
      "
    >
      <Save size={16} />
      CSV
    </button>

    <button
      type="button"
      onClick={downloadExcel}
      className="
      flex
      items-center
      gap-2
      px-4
      py-2
      rounded-xl
      border
      border-[var(--border)]
      hover:bg-[var(--surface-secondary)]
      transition
      "
    >
      <Save size={16} />
      Excel
    </button>
  </div>
</div>

          <div className="space-y-4">
            {tokens.map(
              (token) => (
                <div
                  key={token.id}
                  className="
                  bg-[var(--background)]
                  border
                  border-[var(--border)]
                  rounded-2xl
                  p-5
                  flex
                  flex-col
                  md:flex-row
                  justify-between
                  items-start
                  md:items-center
                  gap-4
                  "
                >
                  <div className="flex-1">
                    <p
                      className="
                      font-mono
                      text-lg
                      break-all
                      "
                    >
                      {
                        token.token
                      }
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      copyToken(
                        token.token
                      )
                    }
                    className="
                    flex
                    items-center
                    gap-2
                    bg-[var(--secondary)]
                    hover:bg-[var(--accent)]
                    text-[var(--background)]
                    px-4
                    py-2
                    rounded-xl
                    font-semibold
                    transition-all
                    duration-300
                    "
                  >
                    <Copy size={16} />
                    Copy
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  </div>
);
}
