import { useEffect, useRef } from "react";
import api from "../utils/api";

export default function useDevtoolsDetect(token, onDetect) {
  const onDetectRef = useRef(onDetect);
  const violationSentRef = useRef(false);
  const detectCountRef = useRef(0);

  // Sync callback ref agar tidak memicu reset interval pada useEffect
  useEffect(() => {
    onDetectRef.current = onDetect;
  }, [onDetect]);

  useEffect(() => {
    if (!token) return;

    // Ambang batas selisih piksel dinaikkan menjadi 350px agar tidak memicu false positive di scaling OS/Sidebar
    const threshold = 350;

    const triggerViolation = async () => {
      if (violationSentRef.current) return;
      violationSentRef.current = true;

      try {
        await api.post(
          "/quiz/violation",
          {
            violationType: "devtools",
            description: "Developer tools detected (docked or console inspection)",
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (typeof onDetectRef.current === "function") {
          onDetectRef.current();
        }
      } catch (error) {
        console.error("Failed to report devtools violation:", error);
      }
    };

    const detect = async () => {
      // METODE 1: Cek Selisih Dimensi Window (Docked DevTools)
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;

      const isDimensionDevtools = widthDiff > threshold || heightDiff > threshold;

      // METODE 2: Cek Timing Execution via RegExp Print (Console / Undocked DevTools)
      let isConsoleOpen = false;
      const startTime = performance.now();
      
      // Mengeksekusi instruksi ringan untuk mengukur latensi
      const element = new Image();
      Object.defineProperty(element, "id", {
        get: function () {
          isConsoleOpen = true;
          return "devtools-detector";
        },
      });
      console.log("%c", element);

      // Jika console inspection aktif atau dimensi melebihi threshold
      if (isDimensionDevtools || isConsoleOpen) {
        detectCountRef.current += 1;

        // Harus terdeteksi berturut-turut selama 4 detik (4x tik interval)
        if (detectCountRef.current >= 4 && !violationSentRef.current) {
          await triggerViolation();
        }
      } else {
        detectCountRef.current = 0;
      }
    };

    const interval = setInterval(detect, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [token]); // Cukup token sebagai dependency utama
}