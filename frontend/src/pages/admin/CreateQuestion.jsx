import { useState, useEffect } from "react";
import api from "../../utils/api";
import { AlertCircle, CheckCircle2, Trash2, FileQuestion, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useDocumentTitle from "../../hooks/useDocumentTitle";

export default function CreateQuestion() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  useDocumentTitle("Create Question | TAXCUNPAM Admin");

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] = useState("error");

  const [loadingQuizzes, setLoadingQuizzes] = useState(true);

  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const [quizzes, setQuizzes] = useState([]);

  const [questions, setQuestions] = useState([]);

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    quiz_id: "",
    question_text: "",
    question_type: "multiple_choice",
    points: 10,
    options: ["", ""],
    correct_option: 0,
    short_answer: "",
  });

  useEffect(() => {
    fetchQuizzes();
  }, []);

  useEffect(() => {
    if (!form.quiz_id) return;

    fetchQuestions();
  }, [form.quiz_id]);

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

      setMessage("Gagal memuat daftar quiz");
    } finally {
      setLoadingQuizzes(false);
    }
  }

  async function fetchQuestions() {
    try {
      setLoadingQuestions(true);

      const token = localStorage.getItem("adminToken");

      const res = await api.get(`/admin/questions/${form.quiz_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setQuestions(res.data.questions || []);
    } catch {
      setMessageType("error");

      setMessage("Gagal memuat soal");
    } finally {
      setLoadingQuestions(false);
    }
  }

  function handleEdit(question) {
    const options = question.question_options?.map(
      (option) => option.option_text,
    ) || ["", ""];

    const correctIndex =
      question.question_options?.findIndex((option) => option.is_correct) ?? 0;

    setEditingId(question.id);

    setForm({
      quiz_id: question.quiz_id,

      question_text: question.question_text,

      question_type: question.question_type,

      points: question.points,

      options,

      correct_option: correctIndex,

      short_answer: question.correct_answer || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleDelete(id) {
    try {
      const token = localStorage.getItem("adminToken");

      await api.delete(`/admin/delete-question/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMessageType("success");

      setMessage("Soal berhasil dihapus");

      await fetchQuestions();
    } catch (err) {
      setMessageType("error");

      setMessage(
        err.response?.data?.message || err.message || "Gagal menghapus soal",
      );
    }
  }

  function addOption() {
    if (form.options.length >= 6) {
      setMessageType("error");

      setMessage("Maksimal 6 pilihan");

      return;
    }

    setForm({
      ...form,
      options: [...form.options, ""],
    });
  }

  function updateOption(value, index) {
    const updated = [...form.options];

    updated[index] = value;

    setForm({
      ...form,
      options: updated,
    });
  }

  function removeOption(index) {
    if (form.options.length <= 2) {
      setMessageType("error");

      setMessage("Minimal 2 pilihan");

      return;
    }

    const updated = form.options.filter((_, i) => i !== index);

    setForm({
      ...form,
      options: updated,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setMessage("");

    try {
      setLoading(true);

      const token = localStorage.getItem("adminToken");

      const payload = {
        quiz_id: form.quiz_id,

        question_text: form.question_text,

        question_type: form.question_type,

        points: Number(form.points),

        options: form.options,

        correct_option: form.correct_option,

        short_answer: form.short_answer,
      };

      if (editingId) {
        await api.put(`/admin/update-question/${editingId}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setMessageType("success");

        setMessage("Soal berhasil diperbarui");

        setEditingId(null);
      } else {
        await api.post("/admin/create-question", payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setMessageType("success");

        setMessage("Soal berhasil dibuat");
      }

      setForm({
        quiz_id: form.quiz_id,
        question_text: "",
        question_type: "multiple_choice",
        points: 10,
        options: ["", ""],
        correct_option: 0,
        short_answer: "",
      });

      await fetchQuestions();
    } catch (err) {
      setMessageType("error");

      setMessage(err.response?.data?.message || "Gagal menyimpan soal");
    } finally {
      setLoading(false);
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
      {/* HEADER */}

      <div
        className="
        flex
        items-center
        justify-between
        mb-8
        "
      >
        <div>
          <div className="flex items-center gap-3">
            <FileQuestion
              size={32}
              className="text-[var(--secondary)]"
            />

            <h1 className="text-4xl font-bold">
              Question Management
            </h1>
          </div>

          <p className="text-[var(--text-secondary)] mt-2">
            Tambah, edit, dan hapus soal quiz
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/admin/dashboard")}
          className="
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

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* QUIZ */}

        <div>
          <label className="block mb-2 text-sm text-[var(--text-secondary)]">
            Quiz
          </label>

          <select
            value={form.quiz_id}
            onChange={(e) =>
              setForm({
                ...form,
                quiz_id: e.target.value,
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
              {loadingQuizzes
                ? "Memuat quiz..."
                : "Pilih Quiz"}
            </option>

            {quizzes.map((quiz) => (
              <option
                key={quiz.id}
                value={quiz.id}
              >
                {quiz.title}
              </option>
            ))}
          </select>
        </div>

        {/* TYPE */}

        <div>
          <label className="block mb-2 text-sm text-[var(--text-secondary)]">
            Tipe Soal
          </label>

          <select
            value={form.question_type}
            onChange={(e) =>
              setForm({
                ...form,
                question_type: e.target.value,
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
            <option value="multiple_choice">
              Pilihan Ganda
            </option>

            <option value="short_answer">
              Isian Singkat
            </option>
          </select>
        </div>

        {/* POINT */}

        <div>
          <label className="block mb-2 text-sm text-[var(--text-secondary)]">
            Poin
          </label>

          <input
            type="number"
            value={form.points}
            onChange={(e) =>
              setForm({
                ...form,
                points: e.target.value,
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

        {/* QUESTION */}

        <div>
          <label className="block mb-2 text-sm text-[var(--text-secondary)]">
            Pertanyaan
          </label>

          <textarea
            value={form.question_text}
            onChange={(e) =>
              setForm({
                ...form,
                question_text: e.target.value,
              })
            }
            placeholder="Masukkan pertanyaan..."
            className="
            w-full
            h-36
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
                {/* MULTIPLE CHOICE */}

        {form.question_type === "multiple_choice" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm text-[var(--text-secondary)]">
                Pilihan Jawaban
              </label>

              <button
                type="button"
                onClick={addOption}
                className="
                border
                border-[var(--border)]
                hover:border-[var(--secondary)]
                px-4
                py-2
                rounded-xl
                transition
                "
              >
                Tambah Pilihan
              </button>
            </div>

            <div className="space-y-3">
              {form.options.map((option, index) => (
                <div
                  key={index}
                  className="
                  flex
                  items-center
                  gap-3
                  "
                >
                  <input
                    type="radio"
                    checked={form.correct_option === index}
                    onChange={() =>
                      setForm({
                        ...form,
                        correct_option: index,
                      })
                    }
                  />

                  <input
                    value={option}
                    onChange={(e) =>
                      updateOption(
                        e.target.value,
                        index
                      )
                    }
                    placeholder={`Pilihan ${index + 1}`}
                    className="
                    flex-1
                    bg-[var(--background)]
                    border
                    border-[var(--border)]
                    rounded-xl
                    p-4
                    outline-none
                    focus:border-[var(--secondary)]
                    "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      removeOption(index)
                    }
                    className="
                    text-[var(--danger)]
                    hover:opacity-80
                    transition
                    "
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SHORT ANSWER */}

        {form.question_type === "short_answer" && (
          <div>
            <label className="block mb-2 text-sm text-[var(--text-secondary)]">
              Jawaban Benar
            </label>

            <input
              value={form.short_answer}
              onChange={(e) =>
                setForm({
                  ...form,
                  short_answer:
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
            />
          </div>
        )}

        {/* CANCEL EDIT */}

        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);

              setForm({
                quiz_id: form.quiz_id,
                question_text: "",
                question_type:
                  "multiple_choice",
                points: 10,
                options: ["", ""],
                correct_option: 0,
                short_answer: "",
              });
            }}
            className="
            w-full
            border
            border-[var(--border)]
            hover:bg-[var(--surface-secondary)]
            py-4
            rounded-xl
            transition
            "
          >
            Batal Edit
          </button>
        )}

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
          font-semibold
          transition
          disabled:opacity-50
          "
        >
          {loading
            ? editingId
              ? "Menyimpan..."
              : "Membuat Soal..."
            : editingId
              ? "Update Question"
              : "Create Question"}
        </button>
      </form>

      {/* EXISTING QUESTIONS */}

      <div
        className="
        mt-10
        bg-[var(--background)]
        border
        border-[var(--border)]
        rounded-3xl
        p-6
        "
      >
        <h2
          className="
          text-2xl
          font-bold
          mb-5
          "
        >
          Existing Questions
        </h2>

        {loadingQuestions ? (
          <p className="text-[var(--text-secondary)]">
            Memuat soal...
          </p>
        ) : questions.length === 0 ? (
          <p className="text-[var(--text-secondary)]">
            Belum ada soal
          </p>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => (
              <div
                key={q.id}
                className="
                bg-[var(--surface)]
                border
                border-[var(--border)]
                rounded-2xl
                p-5
                "
              >
                <div
                  className="
                  flex
                  items-center
                  justify-between
                  mb-3
                  "
                >
                  <span
                    className="
                    text-xs
                    px-3
                    py-1
                    rounded-full
                    bg-[var(--surface-secondary)]
                    "
                  >
                    {q.question_type ===
                    "multiple_choice"
                      ? "Pilihan Ganda"
                      : "Isian Singkat"}
                  </span>

                  <span
                    className="
                    text-[var(--secondary)]
                    text-sm
                    "
                  >
                    {q.points} poin
                  </span>
                </div>

                <p className="font-medium">
                  {q.question_text}
                </p>

                {q.question_options
                  ?.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {q.question_options.map(
                      (
                        option,
                        index
                      ) => (
                        <div
                          key={option.id}
                          className="
                          text-sm
                          text-[var(--text-secondary)]
                          "
                        >
                          {String.fromCharCode(
                            65 + index
                          )}
                          .{" "}
                          {
                            option.option_text
                          }
                        </div>
                      )
                    )}
                  </div>
                )}

                <div className="flex gap-2 mt-5">
                  <button
                    type="button"
                    onClick={() =>
                      handleEdit(q)
                    }
                    className="
                    px-4
                    py-2
                    rounded-xl
                    bg-[var(--secondary)]
                    hover:bg-[var(--accent)]
                    text-[var(--background)]
                    font-medium
                    transition
                    "
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(q.id)
                    }
                    className="
                    px-4
                    py-2
                    rounded-xl
                    bg-[var(--danger)]
                    hover:opacity-90
                    text-white
                    transition
                    "
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);
}
