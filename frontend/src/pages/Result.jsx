import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, AlertCircle, LogOut } from "lucide-react";
import logo from "../assets/MASCOT.png";

import api from "../utils/api";
import useDocumentTitle from "../hooks/useDocumentTitle";

export default function Result() {
  const navigate = useNavigate();
  useDocumentTitle("Result | TAXCUNPAM 2026");

  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(true);

  const autoSubmitted = sessionStorage.getItem("quizAutoSubmitted");

  async function fetchResult() {
    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        navigate("/");
        return;
      }

      const response = await api.get("/quiz/result", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setResult(response.data.result);
    } catch {
      navigate("/");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchResult();
  }, []);

  useEffect(() => {
    if (autoSubmitted) {
      sessionStorage.removeItem("quizAutoSubmitted");
    }
  }, []);

  function formatDuration() {
    if (!result?.started_at || !result?.submitted_at) {
      return "-";
    }

    const start = new Date(result.started_at);

    const end = new Date(result.submitted_at);

    const seconds = Math.floor((end - start) / 1000);

    const minutes = Math.floor(seconds / 60);

    const remaining = seconds % 60;

    return `${minutes}m ${remaining}s`;
  }

  if (loading) {
  return (
    <div
      className="
      min-h-screen
      bg-[var(--background)]
      flex
      flex-col
      items-center
      justify-center
      gap-5
      px-4
      "
    >
      <img
        src={logo}
        alt="Tax Center UNPAM"
        className="
        w-24
        h-24
        object-contain
        drop-shadow-2xl
        "
      />

      <div
        className="
        w-14
        h-14
        rounded-full
        border-4
        border-[var(--border)]
        border-t-[var(--secondary)]
        animate-spin
        "
      />

      <div className="text-center">
        <h2
          className="
          text-xl
          font-semibold
          text-[var(--text-primary)]
          "
        >
          Memuat Hasil...
        </h2>

        <p
          className="
          mt-2
          text-sm
          text-[var(--text-secondary)]
          "
        >
          Mohon tunggu sebentar.
        </p>
      </div>
    </div>
  );
}

 if (!result) {
  return (
    <div
      className="
      min-h-screen
      bg-[var(--background)]
      flex
      items-center
      justify-center
      px-4
      "
    >
      <div
        className="
        w-full
        max-w-md
        bg-[var(--surface)]
        border
        border-[var(--border)]
        rounded-3xl
        p-8
        text-center
        shadow-xl
        "
      >
        <AlertCircle
          size={56}
          className="
          mx-auto
          mb-5
          text-[var(--danger)]
          "
        />

        <h2
          className="
          text-2xl
          font-bold
          text-[var(--text-primary)]
          "
        >
          Hasil Tidak Ditemukan
        </h2>

        <p
          className="
          mt-3
          text-[var(--text-secondary)]
          "
        >
          Data hasil quiz tidak tersedia atau sudah tidak dapat diakses.
        </p>

        <button
          onClick={() => navigate("/")}
          className="
          mt-6
          w-full
          py-3
          rounded-2xl
          bg-[var(--secondary)]
          hover:bg-[var(--accent)]
          text-[var(--background)]
          font-semibold
          transition-all
          duration-300
          "
        >
          Kembali ke Halaman Utama
        </button>
      </div>
    </div>
  );
}

  return (
  <div
    className="
    min-h-screen
    bg-[var(--background)]
    flex
    items-center
    justify-center
    p-5
    text-[var(--text-primary)]
    "
  >
    <div
      className="
      w-full
      max-w-4xl
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
        text-center
        mb-10
        "
      >
        <div className="flex justify-center mb-4">
          <Trophy
            size={52}
            className="
            text-[var(--secondary)]
            "
          />
        </div>

        <h1
          className="
          text-4xl
          font-bold
          mb-3
          "
        >
          Quiz Finished
        </h1>

        <p
          className="
          text-[var(--text-secondary)]
          "
        >
          {result?.quizzes?.title}
        </p>
      </div>

      {/* AUTO SUBMIT */}
      {autoSubmitted && (
        <div
          className="
          mb-8
          flex
          items-start
          gap-3
          p-4
          rounded-2xl
          bg-[var(--danger)]/10
          border
          border-[var(--danger)]/20
          text-[var(--danger)]
          "
        >
          <AlertCircle
            size={18}
            className="
            mt-0.5
            shrink-0
            "
          />

          <div>
            <p className="font-semibold">
              Quiz dikirim otomatis
            </p>

            <p
              className="
              text-sm
              mt-1
              "
            >
              Sistem mendeteksi pelanggaran aturan ujian.
            </p>
          </div>
        </div>
      )}

      {/* SCORE */}
      <div
        className="
        bg-[var(--secondary)]
        text-[var(--background)]
        rounded-3xl
        p-10
        text-center
        mb-8
        shadow-lg
        "
      >
        <p
          className="
          opacity-80
          mb-3
          "
        >
          Final Score
        </p>

        <h1
          className="
          text-7xl
          font-bold
          drop-shadow-[0_0_20px_rgba(212,162,76,0.35)]
          "
        >
          {result.score}
        </h1>
      </div>

      {/* STATS */}
      <div
        className="
        grid
        md:grid-cols-2
        gap-5
        "
      >
        <div
          className="
          bg-[var(--background)]
          border
          border-[var(--border)]
          p-6
          rounded-2xl
          "
        >
          <p className="text-[var(--text-secondary)]">
            Peserta
          </p>

          <h2
            className="
            text-2xl
            font-bold
            mt-2
            "
          >
            {result.participant_name}
          </h2>
        </div>

        <div
          className="
          bg-[var(--background)]
          border
          border-[var(--border)]
          p-6
          rounded-2xl
          "
        >
          <p className="text-[var(--text-secondary)]">
            Durasi
          </p>

          <h2
            className="
            text-2xl
            font-bold
            mt-2
            "
          >
            {formatDuration()}
          </h2>
        </div>

        <div
          className="
          bg-[var(--secondary)]/10
          border
          border-[var(--secondary)]/20
          p-6
          rounded-2xl
          "
        >
          <p className="text-[var(--secondary)]">
            Jawaban Benar
          </p>

          <h2
            className="
            text-4xl
            font-bold
            mt-3
            text-[var(--secondary)]
            "
          >
            {result.correct_answers}
          </h2>
        </div>

        <div
          className="
          bg-[var(--danger)]/10
          border
          border-[var(--danger)]/20
          p-6
          rounded-2xl
          "
        >
          <p className="text-[var(--danger)]">
            Jawaban Salah
          </p>

          <h2
            className="
            text-4xl
            font-bold
            mt-3
            text-[var(--danger)]
            "
          >
            {result.wrong_answers}
          </h2>
        </div>

        <div
          className="
          md:col-span-2
          bg-[var(--accent)]/10
          border
          border-[var(--accent)]/20
          p-6
          rounded-2xl
          "
        >
          <p className="text-[var(--accent)]">
            Tidak Dijawab
          </p>

          <h2
            className="
            text-4xl
            font-bold
            mt-3
            text-[var(--accent)]
            "
          >
            {result.unanswered}
          </h2>
        </div>
      </div>

      {/* BUTTON */}
      <div
        className="
        mt-10
        grid
        gap-4
        "
      >
        <button
          onClick={() => navigate("/leaderboard")}
          className="
          w-full
          bg-[var(--secondary)]
          hover:bg-[var(--accent)]
          text-[var(--background)]
          py-4
          rounded-2xl
          font-semibold
          shadow-lg
          hover:shadow-[0_0_25px_rgba(212,162,76,0.25)]
          transition-all
          duration-300
          "
        >
          Lihat Leaderboard
        </button>

        <button
          onClick={() => {
            localStorage.clear();
            navigate("/");
          }}
          className="
          w-full
          flex
          items-center
          justify-center
          gap-2
          bg-[var(--surface-secondary)]
          hover:bg-[var(--primary)]
          py-4
          rounded-2xl
          font-semibold
          transition
          "
        >
          <LogOut size={18} />
          Keluar
        </button>
      </div>
    </div>
  </div>
);
}
