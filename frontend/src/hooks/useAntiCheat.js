import { useEffect, useRef } from "react";
import api from "../utils/api";

export default function useAntiCheat(
  token,
  onAutoSubmit,
  disabled = false
) {
  const fullscreenStarted = useRef(false);
  const isSubmittingViolation = useRef(false);
  const onAutoSubmitRef = useRef(onAutoSubmit);

  // Selalu simpan callback terbaru tanpa reinstall listener
  useEffect(() => {
    onAutoSubmitRef.current = onAutoSubmit;
  }, [onAutoSubmit]);

  useEffect(() => {
    if (!token || disabled) return;

    let active = true;

    async function sendViolation(
      violationType,
      description
    ) {
      if (
        !active ||
        disabled ||
        isSubmittingViolation.current
      ) {
        return;
      }

      try {
        isSubmittingViolation.current = true;

        const response = await api.post(
          "/quiz/violation",
          {
            violationType,
            description,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!active) return;

        if (
          response.data?.autoSubmitted ||
          response.data?.disqualified
        ) {
          onAutoSubmitRef.current?.();
        }
      } catch (error) {
        console.error(
          "Failed sending anti-cheat violation log:",
          error
        );
      } finally {
        setTimeout(() => {
          isSubmittingViolation.current = false;
        }, 1000);
      }
    }

    function handleVisibility() {
      if (document.hidden) {
        sendViolation(
          "tab_switch",
          "User switched tab or minimized browser"
        );
      }
    }

    function handleFullscreen() {
      if (document.fullscreenElement) {
        fullscreenStarted.current = true;
        return;
      }

      if (fullscreenStarted.current) {
        sendViolation(
          "fullscreen_exit",
          "Exited fullscreen mode"
        );
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    document.addEventListener(
      "fullscreenchange",
      handleFullscreen
    );

    return () => {
      active = false;

      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );

      document.removeEventListener(
        "fullscreenchange",
        handleFullscreen
      );
    };
  }, [token, disabled]);
}