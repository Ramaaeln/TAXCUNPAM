import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";


import {
  ArrowLeft,
  Trophy,
  Users,
  Award,
  Download,
} from "lucide-react";

import api from "../../utils/api";
import useDocumentTitle from "../../hooks/useDocumentTitle";

export default function Leaderboard() {
  const navigate = useNavigate();

  const [loading, setLoading] =
    useState(false);

  const [quizzes, setQuizzes] =
    useState([]);

  const [selectedQuiz, setSelectedQuiz] =
    useState("");

  const [leaderboard, setLeaderboard] =
    useState([]);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState("error");

  useEffect(() => {
    fetchQuizzes();
  }, []);

  useEffect(() => {
    if (!selectedQuiz) return;

    fetchLeaderboard(
      selectedQuiz
    );
  }, [selectedQuiz]);

  async function fetchQuizzes() {
    try {
      const token =
        localStorage.getItem(
          "adminToken"
        );

      const res =
        await api.get(
          "/admin/quizzes",
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      setQuizzes(
        res.data.quizzes || []
      );
    } catch (err) {
      setMessageType(
        "error"
      );

      setMessage(
        err.response?.data
          ?.message ||
          "Gagal memuat quiz"
      );
    }
  }

  async function fetchLeaderboard(
    quizId
  ) {
    try {
      setLoading(true);

      const res =
        await api.get(
          `/leaderboard/${quizId}`
        );

      setLeaderboard(
        res.data.leaderboard || []
      );
    } catch (err) {
      setMessageType(
        "error"
      );

      setMessage(
        err.response?.data
          ?.message ||
          "Gagal memuat leaderboard"
      );
    } finally {
      setLoading(false);
    }
  }

  const totalParticipants =
    leaderboard.length;

  const highestScore =
    leaderboard.length > 0
      ? leaderboard[0].score
      : 0;

  const averageScore =
    leaderboard.length > 0
      ? (
          leaderboard.reduce(
            (sum, item) =>
              sum + item.score,
            0
          ) /
          leaderboard.length
        ).toFixed(1)
      : 0;
function exportExcel() {
  if (!leaderboard.length) return;

  const data = leaderboard.map(
    (item) => ({
      Rank: item.rank,
      Participant:
        item.participant_name,
      Score: item.score,
      Duration:
        item.duration_seconds,
    })
  );

  const worksheet =
    XLSX.utils.json_to_sheet(
      data
    );

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Leaderboard"
  );

  const excelBuffer =
    XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

  const file =
    new Blob(
      [excelBuffer],
      {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }
    );

  saveAs(
    file,
    "leaderboard.xlsx"
  );
}

function exportCSV() {
  if (!leaderboard.length) return;

  const data = leaderboard.map(
    (item) => ({
      Rank: item.rank,
      Participant:
        item.participant_name,
      Score: item.score,
      Duration:
        item.duration_seconds,
    })
  );

  const worksheet =
    XLSX.utils.json_to_sheet(
      data
    );

  const csv =
    XLSX.utils.sheet_to_csv(
      worksheet
    );

  const blob =
    new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

  saveAs(
    blob,
    "leaderboard.csv"
  );
}
  useDocumentTitle("Leaderboard | TAXCUNPAM Admin");

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
      max-w-7xl
      mx-auto
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
          <Trophy
            size={32}
            className="text-[var(--secondary)]"
          />

          <h1 className="text-4xl font-bold">
            Leaderboard
          </h1>
        </div>

        <p className="text-[var(--text-secondary)]">
          Ranking peserta quiz
        </p>
      </div>

      {/* MESSAGE */}

      {message && (
        <div
          className={`
          mb-6
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
          {message}
        </div>
      )}

      {/* FILTER */}

      <div
        className="
        bg-[var(--surface)]
        border
        border-[var(--border)]
        rounded-3xl
        p-6
        shadow-xl
        mb-8
        "
      >
        <label
          className="
          block
          mb-2
          text-sm
          text-[var(--text-secondary)]
          "
        >
          Pilih Quiz
        </label>

        <select
          value={selectedQuiz}
          onChange={(e) =>
            setSelectedQuiz(
              e.target.value
            )
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

      {/* STATS */}

      <div
        className="
        grid
        md:grid-cols-3
        gap-5
        mb-8
        "
      >
        <div
          className="
          bg-[var(--surface)]
          border
          border-[var(--border)]
          rounded-3xl
          p-6
          shadow-xl
          "
        >
          <Users
            size={28}
            className="text-[var(--secondary)]"
          />

          <h2
            className="
            text-4xl
            font-bold
            mt-4
            "
          >
            {totalParticipants}
          </h2>

          <p className="text-[var(--text-secondary)]">
            Participants
          </p>
        </div>

        <div
          className="
          bg-[var(--surface)]
          border
          border-[var(--border)]
          rounded-3xl
          p-6
          shadow-xl
          "
        >
          <Trophy
            size={28}
            className="text-[var(--secondary)]"
          />

          <h2
            className="
            text-4xl
            font-bold
            mt-4
            "
          >
            {highestScore}
          </h2>

          <p className="text-[var(--text-secondary)]">
            Highest Score
          </p>
        </div>

        <div
          className="
          bg-[var(--surface)]
          border
          border-[var(--border)]
          rounded-3xl
          p-6
          shadow-xl
          "
        >
          <Award
            size={28}
            className="text-[var(--secondary)]"
          />

          <h2
            className="
            text-4xl
            font-bold
            mt-4
            "
          >
            {averageScore}
          </h2>

          <p className="text-[var(--text-secondary)]">
            Average Score
          </p>
        </div>
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
        <div
          className="
          px-6
          py-5
          border-b
          border-[var(--border)]
          "
        >
          <div
            className="
            flex
            flex-col
            md:flex-row
            items-start
            md:items-center
            justify-between
            gap-4
            "
          >
            <h2
              className="
              text-xl
              font-bold
              "
            >
              Ranking
            </h2>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={exportExcel}
                className="
                flex
                items-center
                gap-2
                px-4
                py-2
                rounded-xl
                bg-[var(--secondary)]
                hover:bg-[var(--accent)]
                text-[var(--background)]
                font-semibold
                transition-all
                duration-300
                "
              >
                <Download size={16} />
                Excel
              </button>

              <button
                type="button"
                onClick={exportCSV}
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
                <Download size={16} />
                CSV
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table
            className="
            w-full
            text-left
            "
          >
            <thead
              className="
              bg-[var(--background)]
              "
            >
              <tr>
                <th className="p-5">
                  Rank
                </th>

                <th className="p-5">
                  Participant
                </th>

                <th className="p-5">
                  Score
                </th>

                <th className="p-5">
                  Duration
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="4"
                    className="
                    p-10
                    text-center
                    text-[var(--text-secondary)]
                    "
                  >
                    Loading...
                  </td>
                </tr>
              ) : leaderboard.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="
                    p-10
                    text-center
                    text-[var(--text-secondary)]
                    "
                  >
                    Belum ada data
                  </td>
                </tr>
              ) : (
                leaderboard.map(
                  (item) => (
                    <tr
                      key={
                        item.participant_id
                      }
                      className="
                      border-t
                      border-[var(--border)]
                      hover:bg-[var(--surface-secondary)]/40
                      transition
                      "
                    >
                      <td
                        className="
                        p-5
                        font-bold
                        text-[var(--secondary)]
                        "
                      >
                        #{item.rank}
                      </td>

                      <td className="p-5">
                        {
                          item.participant_name
                        }
                      </td>

                      <td
                        className="
                        p-5
                        font-semibold
                        "
                      >
                        {item.score}
                      </td>

                      <td className="p-5">
                        {
                          item.duration_seconds
                        }
                        s
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);
}