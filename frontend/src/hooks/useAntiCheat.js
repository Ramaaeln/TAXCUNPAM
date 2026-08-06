import { useEffect, useRef } from "react";
import api from "../utils/api";

export default function useAntiCheat(token, onAutoSubmit) {
  const fullscreenStarted = useRef(false);
  const isSubmittingViolation = useRef(false);

  useEffect(() => {
    if (!token) return;

    async function sendViolation(violationType, description) {
      // Mencegah spam request pelanggaran dalam waktu bersamaan
      if (isSubmittingViolation.current) return;

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

        if (response.data?.autoSubmitted || response.data?.disqualified) {
          if (typeof onAutoSubmit === "function") {
            onAutoSubmit();
          }
        }
      } catch (error) {
        console.error("Failed sending anti-cheat violation log:", error);
      } finally {
        // Reset guard setelah 1 detik
        setTimeout(() => {
          isSubmittingViolation.current = false;
        }, 1000);
      }
    }

    // 1. Deteksi Pindah Tab
    function handleVisibility() {
      if (document.hidden) {
        sendViolation("tab_switch", "User switched tab or minimized browser");
      }
    }

    // 2. Deteksi Keluar Fullscreen
    function handleFullscreen() {
      if (document.fullscreenElement) {
        fullscreenStarted.current = true;
        return;
      }

      if (fullscreenStarted.current) {
        sendViolation("fullscreen_exit", "Exited fullscreen mode");
      }
    }

    // Pasang Event Listeners (Hilangkan 'blur' langsung untuk mencegah false positive pada elemen form)
    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("fullscreenchange", handleFullscreen);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("fullscreenchange", handleFullscreen);
    };
  }, [token, onAutoSubmit]); // Menjaga closure tetap segar
}