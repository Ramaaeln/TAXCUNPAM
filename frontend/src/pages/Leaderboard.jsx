import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  Medal,
  Award,
  LogOut,
  CheckCircle,
  XCircle,
} from "lucide-react";
import logo from "../assets/MASCOT.png";

import api from "../utils/api";
import useDocumentTitle from "../hooks/useDocumentTitle";

export default function Leaderboard() {
  const navigate = useNavigate();
    useDocumentTitle("Leaderboard | TAXCUNPAM 2026");
  

  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const quizId = localStorage.getItem("quizId");

  const [error, setError] = useState("");

async function fetchLeaderboard() {
  try {
    const response = await api.get(
      `/leaderboard/${quizId}`
    );

    setLeaderboard(
      response.data.leaderboard
    );
  } catch {
    setError(
      "Gagal memuat leaderboard"
    );
  } finally {
    setLoading(false);
  }
}

  useEffect(() => {
    fetchLeaderboard();
  }, []);

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
          Memuat Leaderboard...
        </h2>

        <p
          className="
          mt-2
          text-sm
          text-[var(--text-secondary)]
          "
        >
          Sedang mengambil data peringkat peserta.
        </p>
      </div>
    </div>
  );
}

  const top3 = leaderboard.slice(0, 3);

  return (
  <div
    className="
    min-h-screen
    bg-[var(--background)]
    p-6
    "
  >
    <div className="max-w-6xl mx-auto">
      {/* HEADER */}
      <div
        className="
        flex
        flex-col
        md:flex-row
        md:items-center
        md:justify-between
        gap-4
        mb-10
        "
      >
        <div
          className="
          flex
          items-center
          gap-4
          "
        >
          <div
            className="
            p-3
            rounded-2xl
            bg-[var(--secondary)]/10
            border
            border-[var(--secondary)]/20
            "
          >
            <Trophy
              className="
              w-7
              h-7
              text-[var(--secondary)]
              "
            />
          </div>

          <div>
            <h1
              className="
              text-3xl
              font-bold
              text-[var(--text-primary)]
              "
            >
              Leaderboard
            </h1>

            <p
              className="
              text-[var(--text-secondary)]
              text-sm
              "
            >
              Ranking peserta quiz
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            localStorage.clear();
            navigate("/");
          }}
          className="
          flex
          items-center
          gap-2
          px-4
          py-2
          rounded-xl
          border
          border-[var(--border)]
          bg-[var(--surface)]
          text-[var(--text-secondary)]
          hover:bg-[var(--surface-secondary)]
          transition
          "
        >
          <LogOut size={18} />
          Keluar
        </button>
      </div>

      {/* TOP 3 */}
      <div
        className="
        grid
        md:grid-cols-3
        gap-5
        mb-8
        "
      >
        {top3.map((item) => (
          <div
            key={item.attempt_id}
            className="
            bg-[var(--surface)]
            border
            border-[var(--border)]
            rounded-3xl
            p-6
            text-center
            hover:border-[var(--secondary)]
            transition
            "
          >
            <div
              className="
              flex
              justify-center
              mb-4
              "
            >
              {item.rank === 1 && (
                <Trophy
                  size={42}
                  className="
                  text-[var(--secondary)]
                  "
                />
              )}

              {item.rank === 2 && (
                <Medal
                  size={42}
                  className="
                  text-[var(--text-secondary)]
                  "
                />
              )}

              {item.rank === 3 && (
                <Award
                  size={42}
                  className="
                  text-[var(--accent)]
                  "
                />
              )}
            </div>

            <h2
              className="
              text-xl
              font-semibold
              text-[var(--text-primary)]
              "
            >
              {item.participant_name}
            </h2>

            <p
              className="
              text-4xl
              font-bold
              text-[var(--secondary)]
              mt-4
              "
            >
              {item.score}
            </p>

            <div
              className="
              flex
              justify-center
              gap-5
              mt-5
              "
            >
              <div
                className="
                flex
                items-center
                gap-1
                text-[var(--secondary)]
                text-sm
                "
              >
                <CheckCircle size={16} />
                {item.correct_answers}
              </div>

              <div
                className="
                flex
                items-center
                gap-1
                text-[var(--danger)]
                text-sm
                "
              >
                <XCircle size={16} />
                {item.wrong_answers}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* TABLE */}
      <div
        className="
        bg-[var(--surface)]
        border
        border-[var(--border)]
        rounded-3xl
        overflow-hidden
        shadow-xl
        "
      >
        <div className="overflow-x-auto">
          <table
            className="
            w-full
            text-[var(--text-primary)]
            "
          >
            <thead
              className="
              bg-[var(--background)]
              border-b
              border-[var(--border)]
              "
            >
              <tr>
                <th
                  className="
                  p-4
                  text-left
                  text-sm
                  text-[var(--text-secondary)]
                  font-medium
                  "
                >
                  Rank
                </th>

                <th
                  className="
                  p-4
                  text-left
                  text-sm
                  text-[var(--text-secondary)]
                  font-medium
                  "
                >
                  Peserta
                </th>

                <th
                  className="
                  p-4
                  text-left
                  text-sm
                  text-[var(--text-secondary)]
                  font-medium
                  "
                >
                  Score
                </th>

                <th
                  className="
                  p-4
                  text-left
                  text-sm
                  text-[var(--text-secondary)]
                  font-medium
                  "
                >
                  Benar
                </th>

                <th
                  className="
                  p-4
                  text-left
                  text-sm
                  text-[var(--text-secondary)]
                  font-medium
                  "
                >
                  Salah
                </th>
              </tr>
            </thead>

            <tbody>
              {leaderboard.map((item) => (
                <tr
                  key={item.attempt_id}
                  className="
                  border-b
                  border-[var(--border)]
                  hover:bg-[var(--surface-secondary)]/40
                  transition
                  "
                >
                  <td className="p-4">
                    <span
                      className="
                      px-3
                      py-1
                      rounded-full
                      bg-[var(--surface-secondary)]
                      text-[var(--text-secondary)]
                      text-sm
                      "
                    >
                      #{item.rank}
                    </span>
                  </td>

                  <td
                    className="
                    p-4
                    font-medium
                    "
                  >
                    {item.participant_name}
                  </td>

                  <td
                    className="
                    p-4
                    font-bold
                    text-[var(--secondary)]
                    "
                  >
                    {item.score}
                  </td>

                  <td
                    className="
                    p-4
                    text-[var(--secondary)]
                    "
                  >
                    {item.correct_answers}
                  </td>

                  <td
                    className="
                    p-4
                    text-[var(--danger)]
                    "
                  >
                    {item.wrong_answers}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);
}