import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Mail,
  Lock,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

import api from "../../utils/api";
import useDocumentTitle from "../../hooks/useDocumentTitle";

export default function AdminLogin() {
  const navigate = useNavigate();
  useDocumentTitle("Admin Login | TAXCUNPAM Admin");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  async function handleLogin(e) {
    e.preventDefault();

    setError("");

    if (
      !form.email.trim() ||
      !form.password.trim()
    ) {
      setError(
        "Email dan password wajib diisi."
      );

      return;
    }

    try {
      setLoading(true);

      const response =
        await api.post(
          "/admin/login",
          form
        );

      const data =
        response.data;

      localStorage.setItem(
        "adminToken",
        data.accessToken
      );

      localStorage.setItem(
        "adminUser",
        JSON.stringify(
          data.user
        )
      );

      navigate(
        "/admin/dashboard"
      );
    } catch (error) {
      setError(
        error.response?.data
          ?.message ||
          "Login gagal."
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
        <div
          className="
          w-24
          h-24
          rounded-full
          bg-[var(--secondary)]/10
          border
          border-[var(--secondary)]/20
          flex
          items-center
          justify-center
          mb-5
          "
        >
          <ShieldCheck
            size={44}
            className="
            text-[var(--secondary)]
            "
          />
        </div>

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
          Administrator
        </span>

        <h1
          className="
          text-4xl
          font-bold
          mt-5
          text-[var(--text-primary)]
          "
        >
          Admin Panel
        </h1>

        <p
          className="
          text-[var(--text-secondary)]
          text-center
          mt-2
          "
        >
          Login untuk mengelola
          quiz dan peserta
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
        p-8
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

        {/* EMAIL */}

        <div className="mb-5">
          <label
            className="
            block
            mb-2
            text-sm
            text-[var(--text-secondary)]
            "
          >
            Email
          </label>

          <div className="relative">
            <Mail
              size={18}
              className="
              absolute
              left-4
              top-1/2
              -translate-y-1/2
              text-[var(--text-secondary)]
              "
            />

            <input
              type="email"
              placeholder="admin@email.com"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value,
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
              outline-none
              focus:border-[var(--secondary)]
              transition
              "
            />
          </div>
        </div>

        {/* PASSWORD */}

        <div className="mb-6">
          <label
            className="
            block
            mb-2
            text-sm
            text-[var(--text-secondary)]
            "
          >
            Password
          </label>

          <div className="relative">
            <Lock
              size={18}
              className="
              absolute
              left-4
              top-1/2
              -translate-y-1/2
              text-[var(--text-secondary)]
              "
            />

            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) =>
                setForm({
                  ...form,
                  password: e.target.value,
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
              outline-none
              focus:border-[var(--secondary)]
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
              Login Admin
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <p
        className="
        text-center
        text-[var(--text-secondary)]
        text-sm
        mt-5
        "
      >
        Secure authentication enabled
      </p>
    </div>
  </div>
);
}