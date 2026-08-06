import express from "express";
import { supabase } from "../lib/supabase.js";
import { verifyParticipant } from "../middleware/auth.js";

const router = express.Router();

router.get("/", verifyParticipant, async (req, res) => {
  try {
    const attemptId = req.user.attemptId;

    if (!attemptId) {
      return res.status(401).json({
        success: false,
        message: "Attempt ID tidak ditemukan dalam token",
      });
    }

    // 1. Ambil data attempt aktif peserta
    const { data: attempt, error: attemptError } = await supabase
      .from("quiz_attempts")
      .select("id, status, quiz_id")
      .eq("id", attemptId)
      .maybeSingle();

    if (attemptError || !attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found",
      });
    }

    // 2. Ambil seluruh jawaban tersimpan dari database Supabase
    const { data: answers, error: answersError } = await supabase
      .from("quiz_answers")
      .select("question_id, selected_option_id, text_answer, answered_at")
      .eq("attempt_id", attempt.id);

    if (answersError) {
      console.error("Error fetching answers:", answersError);
      return res.status(500).json({
        success: false,
        message: "Gagal mengambil riwayat jawaban",
      });
    }

    return res.json({
      success: true,
      status: attempt.status,
      answers: answers || [],
    });
  } catch (error) {
    console.error("Recover endpoint error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;  