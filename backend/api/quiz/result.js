import express from "express";
import { supabase } from "../lib/supabase.js";
import { verifyParticipant } from "../middleware/auth.js";

const router = express.Router();

router.get("/", verifyParticipant, async (req, res) => {
  try {
    // attemptId didapatkan dari decoded token di middleware verifyParticipant
    const attemptId = req.user?.attemptId || req.user?.sessionId;

    if (!attemptId) {
      return res.status(401).json({
        success: false,
        message: "Invalid participant token",
      });
    }

    const { data, error } = await supabase
      .from("quiz_attempts")
      .select(`
        id,
        participant_name,
        participant_email,
        score,
        total_questions,
        correct_answers,
        wrong_answers,
        unanswered,
        status,
        auto_submitted,
        disqualified_reason,
        started_at,
        submitted_at,
        quizzes (
          id,
          title,
          description
        )
      `)
      .eq("id", attemptId)
      .maybeSingle();

    if (error) {
      console.error("Fetch result DB error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch quiz result",
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    return res.json({
      success: true,
      result: data,
    });
  } catch (error) {
    console.error("Result endpoint internal error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;