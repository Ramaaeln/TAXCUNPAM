import { useEffect, useRef } from "react";
import api from "../utils/api";

export default function useDevtoolsDetect(
  token,
  onDetect
) {
  const onDetectRef = useRef(onDetect);
  const violationSentRef = useRef(false);
  const detectCountRef = useRef(0);

  useEffect(() => {
    onDetectRef.current = onDetect;
  }, [onDetect]);

 useEffect(() => {
  if (!token) return;

  const threshold = 500;
  let interval = null;

  const triggerViolation = async () => {
    if (violationSentRef.current) return;

    violationSentRef.current = true;

    try {
      const response = await api.post(
        "/quiz/violation",
        {
          violationType: "devtools",
          description: "Developer tools detected",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (
        response.data?.autoSubmitted ||
        response.data?.disqualified
      ) {
        onDetectRef.current?.();
      }
    } catch (error) {
      console.error(
        "Failed to report devtools violation:",
        error
      );

      violationSentRef.current = false;
    }
  };

  const detect = async () => {
    const widthDiff =
      window.outerWidth - window.innerWidth;

    const heightDiff =
      window.outerHeight - window.innerHeight;

    const detected =
      widthDiff > threshold ||
      heightDiff > threshold;

    if (detected) {
      detectCountRef.current += 1;

      if (
        detectCountRef.current >= 8 &&
        !violationSentRef.current
      ) {
        await triggerViolation();
      }
    } else {
      detectCountRef.current = 0;
    }
  };

  const startTimeout = setTimeout(() => {
    interval = setInterval(detect, 1000);
  }, 5000);

  return () => {
    clearTimeout(startTimeout);

    if (interval) {
      clearInterval(interval);
    }
  };
}, [token]);
}