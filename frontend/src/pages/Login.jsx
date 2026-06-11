import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, Users, ArrowRight, AlertCircle } from "lucide-react";

import api from "../utils/api";
import logo from "../assets/MASCOT.png";
import useDocumentTitle from "../hooks/useDocumentTitle";

export default function Login() {
  const navigate = useNavigate();
    useDocumentTitle("Login | TAXCUNPAM 2026");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [form, setForm] = useState({
    token: "",
    participantName: "",
  });

  async function handleLogin(e) {
    e.preventDefault();

    setError("");

    if (!form.token.trim() || !form.participantName.trim()) {
      setError("Token dan nama team wajib diisi.");
      return;
    }

    try {
      setLoading(true);

      const { data } = await api.post("/auth/token-login", {
        token: form.token.trim(),
        participantName: form.participantName.trim(),
      });

      localStorage.setItem("accessToken", data.accessToken);

      localStorage.setItem("quizId", data.quizId);

      localStorage.setItem("attemptId", data.attemptId);

      navigate("/quiz");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Gagal masuk ke quiz. Silakan coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  }

 return (
  <div
    className="
    min-h-screen
    bg-[var(--background)]
    flex
    items-center
    justify-center
    px-5
    py-10
    "
  >
    <div
      className="
      w-full
      max-w-md
      "
    >
      {/* HEADER */}
      <div
        className="
        flex
        flex-col
        items-center
        mb-8
        "
      >
        <img
          src={logo}
          alt="Tax Center UNPAM"
          className="
          w-56
          h-56
          object-contain
          drop-shadow-2xl
          "
        />

        <span
          className="
          px-4
          py-1.5
          rounded-full
          bg-[var(--secondary)]/10
          border
          border-[var(--secondary)]/20
          text-[var(--secondary)]
          text-xs
          font-semibold
          tracking-widest
          uppercase
          "
        >
          National Tax Quiz 2026
        </span>

        <h1
          className="
          text-4xl
          font-bold
          text-[var(--text-primary)]
          text-center
          mt-5
          "
        >
          TAX CENTER UNPAM
        </h1>

        <p
          className="
          text-[var(--text-secondary)]
          text-center
          mt-2
          "
        >
          The Evolution of Tax Systems
        </p>
      </div>

      {/* CARD */}
      <form
        onSubmit={handleLogin}
        className="
        bg-[var(--surface)]
        border
        border-[var(--border)]
        rounded-3xl
        p-7
        shadow-xl
        "
      >
        {/* ERROR */}
        {error && (
          <div
            className="
            flex
            items-start
            gap-3
            mb-5
            p-4
            rounded-xl
            bg-[var(--danger)]/10
            border
            border-[var(--danger)]/20
            "
          >
            <AlertCircle
              size={18}
              className="
              text-[var(--danger)]
              mt-0.5
              shrink-0
              "
            />

            <p
              className="
              text-sm
              text-[var(--danger)]
              "
            >
              {error}
            </p>
          </div>
        )}

        {/* TOKEN */}
        <div className="mb-5">
          <label
            className="
            block
            mb-2
            text-sm
            text-[var(--text-secondary)]
            "
          >
            Token Quiz
          </label>

          <div className="relative">
            <KeyRound
              size={18}
              className="
              absolute
              left-4
              top-1/2
              -translate-y-1/2
              text-[var(--text-secondary)]
              opacity-60
              "
            />

            <input
              type="text"
              placeholder="Masukkan token"
              value={form.token}
              onChange={(e) =>
                setForm({
                  ...form,
                  token: e.target.value,
                })
              }
              className="
              w-full
              bg-[var(--background)]
              border
              border-[var(--border)]
              rounded-xl
              pl-11
              pr-4
              py-3
              text-[var(--text-primary)]
              placeholder:text-[var(--text-secondary)]
              placeholder:opacity-60
              focus:outline-none
              focus:border-[var(--secondary)]
              focus:ring-2
              focus:ring-[var(--secondary)]/20
              transition
              "
            />
          </div>
        </div>

        {/* TEAM */}
        <div className="mb-6">
          <label
            className="
            block
            mb-2
            text-sm
            text-[var(--text-secondary)]
            "
          >
            Nama Team
          </label>

          <div className="relative">
            <Users
              size={18}
              className="
              absolute
              left-4
              top-1/2
              -translate-y-1/2
              text-[var(--text-secondary)]
              opacity-60
              "
            />

            <input
              type="text"
              placeholder="Masukkan nama team"
              value={form.participantName}
              onChange={(e) =>
                setForm({
                  ...form,
                  participantName: e.target.value,
                })
              }
              className="
              w-full
              bg-[var(--background)]
              border
              border-[var(--border)]
              rounded-xl
              pl-11
              pr-4
              py-3
              text-[var(--text-primary)]
              placeholder:text-[var(--text-secondary)]
              placeholder:opacity-60
              focus:outline-none
              focus:border-[var(--secondary)]
              focus:ring-2
              focus:ring-[var(--secondary)]/20
              transition
              "
            />
          </div>
        </div>

        {/* BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="
          w-full
          flex
          items-center
          justify-center
          gap-2
          py-3
          rounded-xl
          bg-[var(--secondary)]
          hover:bg-[var(--accent)]
          text-[var(--background)]
          font-semibold
          shadow-lg
          hover:shadow-[0_0_25px_rgba(212,162,76,0.25)]
          transition-all
          duration-300
          disabled:opacity-50
          disabled:cursor-not-allowed
          "
        >
          {loading ? (
            "Memproses..."
          ) : (
            <>
              Masuk ke Quiz
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <p
        className="
        text-center
        text-[var(--text-secondary)]
        opacity-70
        text-sm
        mt-5
        "
      >
        Pastikan token diberikan oleh panitia sebelum memulai quiz.
      </p>
    </div>
  </div>
);
}
