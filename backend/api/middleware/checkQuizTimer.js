import { supabase } from "../lib/supabase.js";
import { finalizeAttempt } from "../utils/finalizeAttempt.js";

// Tambahkan kata kunci 'export' sebelum 'function'
export async function checkQuizTimer(req, res, next) {
  try {
    const attemptId = req.user?.attemptId;

    if (!attemptId) {
      return res.status(401).json({
        success: false,
        message: "Invalid or missing attempt token",
      });
    }

    const { data: attempt, error: attemptError } = await supabase
      .from("quiz_attempts")
      .select(`
        *,
        quizzes (
          duration_minutes
        )
      `)
      .eq("id", attemptId)
      .maybeSingle();

    if (attemptError || !attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found",
      });
    }

    if (attempt.status !== "in_progress") {
      if (req.originalUrl.includes("/submit")) {
        req.attempt = attempt;
        return next();
      }

      return res.status(400).json({
        success: false,
        message: "Quiz already ended",
      });
    }

    const startedAt = new Date(attempt.started_at);
    const durationMs = Number(attempt.quizzes?.duration_minutes) * 60 * 1000;
    if (!Number.isFinite(startedAt.getTime()) || !Number.isFinite(durationMs) || durationMs <= 0) {
      return res.status(503).json({ success: false, message: "Quiz timer configuration invalid" });
    }
    const gracePeriodMs = 15 * 1000;
    const endTime = new Date(startedAt.getTime() + durationMs + gracePeriodMs);
    const now = new Date();
    req.isTimeout = now.getTime() >= startedAt.getTime() + durationMs;

    if (now > endTime) {
      if (req.originalUrl.includes("/submit") || req.method === "GET") {
        req.isTimeout = true;
        req.attempt = attempt;
        return next();
      }

      await finalizeAttempt(attempt, "timeout");

      return res.status(403).json({
        success: false,
        message: "Quiz time expired",
        code: "QUIZ_EXPIRED",
      });
    }

    req.attempt = attempt;
    next();
  } catch (error) {
    console.error("Check quiz timer middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
