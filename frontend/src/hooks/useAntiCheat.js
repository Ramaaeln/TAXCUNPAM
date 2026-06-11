import { useEffect } from "react";
import { useRef } from "react";

import api from "../utils/api";

export default function useAntiCheat(token, onAutoSubmit) {
  const fullscreenStarted = useRef(false);
  useEffect(() => {
    async function sendViolation(violationType, description) {
      try {
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
          },
        );

        if (response.data.autoSubmitted) {
          onAutoSubmit();
        }
      } catch{}
    }

    function handleVisibility() {
      if (document.hidden) {
        sendViolation("tab_switch", "User switched tab");
      }
    }


    function handleBlur() {
      sendViolation("blur", "Window lost focus");
    }

   function handleFullscreen() {
  if (document.fullscreenElement) {
    fullscreenStarted.current = true;
    return;
  }

  if (fullscreenStarted.current) {
    sendViolation(
      "fullscreen_exit",
      "Exited fullscreen"
    );
  }
}

    document.addEventListener("visibilitychange", handleVisibility);

    window.addEventListener("blur", handleBlur);

    document.addEventListener("fullscreenchange", handleFullscreen);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);

      window.removeEventListener("blur", handleBlur);

      document.removeEventListener("fullscreenchange", handleFullscreen);
    };
  }, []);
}
