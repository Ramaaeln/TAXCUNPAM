import express from "express";
import { supabase } from "../lib/supabase.js";
import { verifyParticipant } from "../middleware/auth.js";

const router = express.Router();

router.get("/:quizId", verifyParticipant, async (req, res) => {
  try {
    const { quizId } = req.params;

    // 1. Validasi Keamanan: Pastikan quizId sesuai dengan token peserta
    if (req.user?.quizId && req.user.quizId !== quizId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Anda tidak memiliki akses ke kuis ini",
      });
    }

    // 2. Query data kuis menggunakan maybeSingle()
    const { data: quizData, error } = await supabase
      .from("quizzes")
      .select(`
        id,
        title,
        description,
        duration_minutes
      `)
      .eq("id", quizId)
      .maybeSingle();

    if (error) {
      console.error("Fetch quiz info DB error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch quiz info",
      });
    }

    if (!quizData) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    return res.json({
      success: true,
      quiz: quizData,
    });
  } catch (error) {
    console.error("Quiz info endpoint error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;