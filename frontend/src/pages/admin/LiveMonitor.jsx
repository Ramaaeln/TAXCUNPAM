import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import {
  ArrowLeft,
  MonitorPlay,
  Users,
  Trophy,
  ShieldAlert,
} from "lucide-react";
import useDocumentTitle from "../../hooks/useDocumentTitle";

export default function LiveMonitor() {
  const navigate = useNavigate();
  useDocumentTitle("Live Monitor | TAXCUNPAM Admin");

  const [loading, setLoading] = useState(true);

  const [participants, setParticipants] = useState([]);
  const [message, setMessage] = useState("");

  const [messageType, setMessageType] = useState("error");

  useEffect(() => {
    fetchMonitor();

    const interval = setInterval(
      fetchMonitor,

      5000,
    );

    return () => {
      clearInterval(interval);
    };
  }, []);

  async function fetchMonitor() {
    try {
      const token = localStorage.getItem("adminToken");

      const res = await api.get(
        "/admin/live-monitor",

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setParticipants(res.data.participants || []);
    } catch (err) {
      setMessageType("error");

      setMessage(err.response?.data?.message || "Gagal memuat data monitor");
    } finally {
      setLoading(false);
    }
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
        Memuat monitor...
      </p>

      <p
        className="
        text-sm
        text-[var(--text-secondary)]
        mt-1
        "
      >
        Mengambil data monitoring peserta secara realtime
      </p>
    </div>
  );
}

  const active = participants.filter((p) => p.status === "in_progress").length;

  const submitted = participants.filter((p) => p.status === "submitted").length;

  const violations = participants.reduce(
    (sum, p) => sum + (p.violation_count || 0),

    0,
  );

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

      <div
        className="
        flex
        items-start
        justify-between
        flex-wrap
        gap-4
        mb-8
        "
      >
        <div>
          <button
            type="button"
            onClick={() =>
              navigate("/admin/dashboard")
            }
            className="
            mb-5
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

          <div className="flex items-center gap-3 mb-2">
            <MonitorPlay
              size={32}
              className="text-[var(--secondary)]"
            />

            <h1 className="text-4xl font-bold">
              Live Monitor
            </h1>
          </div>

          <p className="text-[var(--text-secondary)]">
            Realtime participant monitoring
          </p>

          {message && (
            <div
              className={`
              mt-5
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
              <ShieldAlert size={18} />
              <span>{message}</span>
            </div>
          )}
        </div>

        <div
          className="
          px-4
          py-2
          rounded-xl
          bg-[var(--surface)]
          border
          border-[var(--border)]
          text-sm
          text-[var(--text-secondary)]
          "
        >
          Refresh setiap 5 detik
        </div>
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
        {[
          [<Users size={30} />, "Active", active],

          [
            <Trophy size={30} />,
            "Submitted",
            submitted,
          ],

          [
            <ShieldAlert size={30} />,
            "Violations",
            violations,
          ],
        ].map((item, index) => (
          <div
            key={index}
            className="
            bg-[var(--surface)]
            border
            border-[var(--border)]
            rounded-3xl
            p-6
            shadow-xl
            "
          >
            <div className="text-[var(--secondary)]">
              {item[0]}
            </div>

            <h2
              className="
              text-4xl
              font-bold
              mt-4
              "
            >
              {item[2]}
            </h2>

            <p className="text-[var(--text-secondary)]">
              {item[1]}
            </p>
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
        <div
          className="
          px-6
          py-5
          border-b
          border-[var(--border)]
          "
        >
          <h2
            className="
            text-xl
            font-bold
            "
          >
            Participant Activity
          </h2>
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

                <th className="p-5">
                  DevTools
                </th>

                <th className="p-5">
                  Fullscreen
                </th>

                <th className="p-5">
                  Tab
                </th>
              </tr>
            </thead>

            <tbody>
              {participants.map(
                (participant) => (
                  <tr
                    key={participant.id}
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
                      {participant.score}
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

                    <td className="p-5">
                      {
                        participant.devtools_violations
                      }
                    </td>

                    <td className="p-5">
                      {
                        participant.fullscreen_violations
                      }
                    </td>

                    <td className="p-5">
                      {
                        participant.tab_switch_violations
                      }
                    </td>
                  </tr>
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
