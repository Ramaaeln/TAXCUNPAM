import { useEffect } from "react";
import api from "../utils/api";

export default function useDevtoolsDetect(
  token,
  onDetect
) {
  useEffect(() => {
    if (!token) return;

    let violationSent = false;
    let detectCount = 0;

    const threshold = 300;

    const detect = async () => {
      const widthDiff =
        window.outerWidth - window.innerWidth;

      const heightDiff =
        window.outerHeight - window.innerHeight;

      const isDevtoolsOpen =
        widthDiff > threshold ||
        heightDiff > threshold;
      if (isDevtoolsOpen) {
        detectCount++;

        // Devtools harus terdeteksi selama 5 detik
        if (
          detectCount >= 5 &&
          !violationSent
        ) {
          violationSent = true;

          try {
            await api.post(
              "/quiz/violation",
              {
                violationType: "devtools",
                description:
                  "Devtools detected",
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            onDetect?.();
          } catch (error) {
            console.error(error);
          }
        }
      } else {
        detectCount = 0;
        violationSent = false;
      }
    };

    const interval = setInterval(
      detect,
      1000
    );

    return () => {
      clearInterval(interval);
    };
  }, [token, onDetect]);
}