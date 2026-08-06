import express from "express";
import { supabase } from "../lib/supabase.js";
import { verifyParticipant } from "../middleware/auth.js";

const router = express.Router();

router.post("/", verifyParticipant, async (req, res) => {
  try {
    const attemptId = req.user?.attemptId;
    const sessionId = req.user?.sessionId;

    if (!attemptId) {
      return res.status(400).json({
        success: false,
        message: "Invalid participant token",
      });
    }

    const nowISO = new Date().toISOString();

    // 1. Ambil status attempt saat ini
    const { data: attempt, error: attemptError } = await supabase
      .from("quiz_attempts")
      .select("status")
      .eq("id", attemptId)
      .maybeSingle();

    if (attemptError) {
      console.error("Heartbeat status check error:", attemptError);
      return res.status(500).json({
        success: false,
        message: "Failed to verify attempt status",
      });
    }

    // 2. Jika kuis sudah selesai/ditutup, beri tahu frontend tanpa melemparkan error HTTP
    if (
      attempt &&
      ["submitted", "disqualified", "auto_submitted", "timeout"].includes(
        attempt.status
      )
    ) {
      return res.json({
        success: true,
        isFinished: true,
        status: attempt.status,
      });
    }

    // 3. Update last_heartbeat pada quiz_attempts jika kuis masih berjalan
    await supabase
      .from("quiz_attempts")
      .update({ last_heartbeat: nowISO })
      .eq("id", attemptId);

    // 4. Update last_heartbeat pada participant_sessions jika sessionId ada
    if (sessionId) {
      await supabase
        .from("participant_sessions")
        .update({ last_heartbeat: nowISO })
        .eq("id", sessionId);
    }

    return res.json({
      success: true,
      isFinished: false,
    });
  } catch (error) {
    console.error("Heartbeat endpoint error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;