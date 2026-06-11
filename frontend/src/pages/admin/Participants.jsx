import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Users,
  Search,
  Download,
  Trophy,
} from "lucide-react";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import api from "../../utils/api";
import useDocumentTitle from "../../hooks/useDocumentTitle";

export default function Participants() {
  const navigate = useNavigate();
  useDocumentTitle("Participants | TAXCUNPAM Admin");

  const [loading, setLoading] =
    useState(true);

  const [participants, setParticipants] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState("error");

  useEffect(() => {
    fetchParticipants();
  }, []);

 async function fetchParticipants() {
  try {
    const token =
      localStorage.getItem(
        "adminToken"
      );

    const res =
      await api.get(
        "/admin/live-monitor",
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

    setParticipants(
      res.data.participants || []
    );
  } catch (err) {
    setMessage(
      err.response?.data
        ?.message ||
        "Failed to load participants"
    );
  } finally {
    setLoading(false);
  }
}

const totalParticipants =
  participants.length;




const totalViolations =
  participants.reduce(
    (sum, p) =>
      sum +
      (p.violation_count ||
        0),
    0
  );

  function exportExcel() {
    const data =
  participants.map(
    (p) => ({
      Participant:
        p.participant_name,

      Quiz:
        p.quizzes?.title,

      Status:
        p.status,

      Score:
        p.score,

      Violations:
        p.violation_count,

      Devtools:
        p.devtools_violations,

      Fullscreen:
        p.fullscreen_violations,

      TabSwitch:
        p.tab_switch_violations,
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
      "Participants"
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
      "participants.xlsx"
    );
  }

  function exportCSV() {
    const data =
      filteredParticipants.map(
        (p) => ({
          Participant:
            p.participant_name,

          Quiz:
            p.quizzes?.title,

          Status:
            p.status,

          Score:
            p.score,

          Violations:
            p.violation_count,
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
      "participants.csv"
    );
  }

  const filteredParticipants =
    participants.filter((p) =>
      p.participant_name
        ?.toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );

  const submitted =
    participants.filter(
      (p) =>
        p.status ===
        "submitted"
    ).length;

  const active =
    participants.filter(
      (p) =>
        p.status ===
        "in_progress"
    ).length;

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
      text-[var(--text-secondary)]
      "
    >
      <div
        className="
        w-14
        h-14
        border-4
        border-[var(--border)]
        border-t-[var(--secondary)]
        rounded-full
        animate-spin
        mb-5
        "
      />

      <p className="text-lg font-medium">
        Loading...
      </p>

      <p
        className="
        text-sm
        text-[var(--text-secondary)]
        mt-1
        "
      >
        Memuat data peserta
      </p>
    </div>
  );
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
      max-w-7xl
      mx-auto
      "
    >
      {/* HEADER */}

      <button
        onClick={() =>
          navigate(
            "/admin/dashboard"
          )
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

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users
            size={32}
            className="text-[var(--secondary)]"
          />

          <h1 className="text-4xl font-bold">
            Participants
          </h1>
        </div>

        <p className="text-[var(--text-secondary)]">
          Manage participant data
        </p>
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
            {participants.length}
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
            {submitted}
          </h2>

          <p className="text-[var(--text-secondary)]">
            Submitted
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
            {active}
          </h2>

          <p className="text-[var(--text-secondary)]">
            Active
          </p>
        </div>
      </div>

      {/* SEARCH & EXPORT */}

      <div
        className="
        bg-[var(--surface)]
        border
        border-[var(--border)]
        rounded-3xl
        p-6
        shadow-xl
        mb-6
        "
      >
        <div
          className="
          flex
          flex-col
          md:flex-row
          gap-4
          justify-between
          "
        >
          <div className="relative flex-1">
            <Search
              size={18}
              className="
              absolute
              left-4
              top-4
              text-[var(--text-secondary)]
              "
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search participant..."
              className="
              w-full
              bg-[var(--background)]
              border
              border-[var(--border)]
              rounded-xl
              py-3
              pl-11
              pr-4
              outline-none
              focus:border-[var(--secondary)]
              "
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={exportExcel}
              className="
              flex
              items-center
              gap-2
              px-4
              py-3
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
              onClick={exportCSV}
              className="
              flex
              items-center
              gap-2
              px-4
              py-3
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
                  Participant
                </th>

                <th className="p-5">
                  Quiz
                </th>

                <th className="p-5">
                  Status
                </th>

                <th className="p-5">
                  Score
                </th>

                <th className="p-5">
                  Violations
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredParticipants.map(
                (participant) => (
                  <tr
                    key={
                      participant.id
                    }
                    className="
                    border-t
                    border-[var(--border)]
                    hover:bg-[var(--surface-secondary)]/40
                    transition
                    "
                  >
                    <td className="p-5 font-medium">
                      {
                        participant.participant_name
                      }
                    </td>

                    <td
                      className="
                      p-5
                      text-[var(--text-secondary)]
                      "
                    >
                      {
                        participant
                          ?.quizzes
                          ?.title
                      }
                    </td>

                    <td className="p-5">
                      <span
                        className={`
                        px-3
                        py-1
                        rounded-full
                        text-xs
                        font-medium

                        ${
                          participant.status ===
                          "submitted"
                            ? "bg-[var(--secondary)]/10 text-[var(--secondary)]"
                            : participant.status ===
                                "in_progress"
                              ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                              : "bg-[var(--danger)]/10 text-[var(--danger)]"
                        }
                        `}
                      >
                        {
                          participant.status
                        }
                      </span>
                    </td>

                    <td className="p-5">
                      {
                        participant.score
                      }
                    </td>

                    <td
                      className="
                      p-5
                      text-[var(--danger)]
                      font-semibold
                      "
                    >
                      {
                        participant.violation_count
                      }
                    </td>
                  </tr>
                )
              )}

              {filteredParticipants.length ===
                0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="
                    p-10
                    text-center
                    text-[var(--text-secondary)]
                    "
                  >
                    Tidak ada peserta ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);
}
