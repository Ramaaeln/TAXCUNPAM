import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { ArrowLeft, FilePlus2, AlertCircle, CheckCircle2 } from "lucide-react";

import api from "../../utils/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import useDocumentTitle from "../../hooks/useDocumentTitle";

export default function CreateQuiz() {
  const navigate = useNavigate();
  useDocumentTitle("Create Quiz | TAXCUNPAM Admin");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [messageType, setMessageType] = useState("error");

  const [form, setForm] = useState({
    title: "",
    description: "",
    duration_minutes: 60,
    start_time: "",
    end_time: "",
  });
  const [startDate, setStartDate] = useState(null);

  const [endDate, setEndDate] = useState(null);
  async function handleSubmit(e) {
    e.preventDefault();

    setMessage("");

    try {
      setLoading(true);

      const token = localStorage.getItem("adminToken");

      await api.post("/admin/create-quiz", form, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMessageType("success");

      setMessage("Quiz berhasil dibuat");

      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 1200);
    } catch (err) {
      setMessageType("error");

      setMessage(err.response?.data?.message || "Gagal membuat quiz");
    } finally {
      setLoading(false);
    }
  }

  const calculatedEndDate = startDate
    ? new Date(startDate.getTime() + form.duration_minutes * 60 * 1000)
    : null;

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      start_time: startDate ? startDate.toISOString() : "",
      end_time: calculatedEndDate ? calculatedEndDate.toISOString() : "",
    }));
  }, [startDate, calculatedEndDate]);

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
          onClick={() => navigate("/admin/dashboard")}
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
            <FilePlus2 size={32} className="text-[var(--secondary)]" />

            <h1 className="text-4xl font-bold">Create Quiz</h1>
          </div>

          <p className="text-[var(--text-secondary)]">
            Buat quiz baru untuk peserta
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
            {messageType === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}

            <span>{message}</span>
          </div>
        )}

        {/* FORM */}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* TITLE */}

          <div>
            <label className="text-sm text-[var(--text-secondary)]">
              Quiz Title
            </label>

            <input
              type="text"
              value={form.title}
              onChange={(e) =>
                setForm({
                  ...form,
                  title: e.target.value,
                })
              }
              className="
            w-full
            mt-2
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

          {/* DESCRIPTION */}

          <div>
            <label className="text-sm text-[var(--text-secondary)]">
              Description
            </label>

            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
              className="
            w-full
            mt-2
            h-32
            bg-[var(--background)]
            border
            border-[var(--border)]
            rounded-xl
            p-4
            outline-none
            resize-none
            focus:border-[var(--secondary)]
            "
            />
          </div>

          {/* DURATION */}

          <div>
            <label className="text-sm text-[var(--text-secondary)]">
              Duration (Minutes)
            </label>

            <input
              type="number"
              value={form.duration_minutes}
              onChange={(e) =>
                setForm({
                  ...form,
                  duration_minutes: Number(e.target.value),
                })
              }
              className="
            w-full
            mt-2
            bg-[var(--background)]
            border
            border-[var(--border)]
            rounded-xl
            p-4
            outline-none
            focus:border-[var(--secondary)]
            "
            />
            <select
              value={form.duration_minutes}
              onChange={(e) =>
                setForm({
                  ...form,
                  duration_minutes: Number(e.target.value),
                })
              }
              className="
  w-full
  mt-2
  bg-[var(--background)]
  border
  border-[var(--border)]
  rounded-xl
  p-4
  "
            >
              <option value={30}>30 Menit</option>

              <option value={60}>60 Menit</option>

              <option value={90}>90 Menit</option>

              <option value={120}>120 Menit</option>

              <option value={180}>180 Menit</option>
            </select>
          </div>

          {/* START & END */}

          <div className="grid md:grid-cols-2 gap-5">
            {/* START TIME */}

            <div>
              <label className="text-sm text-[var(--text-secondary)]">
                Start Time
              </label>

              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                showTimeSelect
                timeIntervals={15}
                dateFormat="dd/MM/yyyy HH:mm"
                placeholderText="Pilih waktu mulai"
                className="
    w-full
    mt-2
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

            {/* END TIME */}

            <div>
              <label className="text-sm text-[var(--text-secondary)]">
                End Time
              </label>

              <div
                className="
    mt-2
    p-4
    rounded-xl
    border
    border-[var(--border)]
    bg-[var(--surface-secondary)]
    "
              >
                {calculatedEndDate
                  ? calculatedEndDate.toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "-"}
              </div>

              <p
                className="
    text-xs
    mt-2
    text-[var(--text-secondary)]
    "
              >
                Otomatis dihitung dari waktu mulai dan durasi.
              </p>
            </div>
          </div>

          {/* SUBMIT */}

          <button
            disabled={loading}
            className="
          w-full
          bg-[var(--secondary)]
          hover:bg-[var(--accent)]
          text-[var(--background)]
          py-4
          rounded-xl
          font-bold
          shadow-lg
          hover:shadow-[0_0_25px_rgba(212,162,76,0.25)]
          transition-all
          duration-300
          disabled:opacity-50
          disabled:cursor-not-allowed
          "
          >
            {loading ? "Creating..." : "Create Quiz"}
          </button>
        </form>
      </div>
    </div>
  );
}
