import express from "express";
import { supabase } from "../lib/supabase.js";
import { verifyParticipant } from "../middleware/auth.js";
import { checkQuizTimer } from "../middleware/checkQuizTimer.js";

const router = express.Router();

router.post(
  "/",
  verifyParticipant,
  checkQuizTimer,
  async (req, res) => {
    try {
      const { questionId, selectedOptionId, textAnswer } = req.body;
      const attemptId = req.user?.attemptId;

      if (!attemptId) {
        return res.status(401).json({
          success: false,
          message: "Invalid participant token",
        });
      }

      if (!questionId) {
        return res.status(400).json({
          success: false,
          message: "Question ID required",
        });
      }

      const { data: question, error: questionError } = await supabase
        .from("questions").select("id, question_type")
        .eq("id", questionId).eq("quiz_id", req.attempt.quiz_id)
        .is("deleted_at", null).maybeSingle();
      if (questionError) throw questionError;
      if (!question) return res.status(400).json({ success: false, message: "Question does not belong to this quiz" });
      if (question.question_type === "multiple_choice" && selectedOptionId) {
        const { data: option, error: optionError } = await supabase
          .from("question_options").select("id").eq("id", selectedOptionId)
          .eq("question_id", questionId).maybeSingle();
        if (optionError) throw optionError;
        if (!option) return res.status(400).json({ success: false, message: "Invalid option for this question" });
      }
      if (textAnswer != null && (typeof textAnswer !== "string" || textAnswer.length > 10000)) {
        return res.status(400).json({ success: false, message: "Invalid text answer" });
      }

      // 1. Sanitasi input
      const cleanSelectedOption = question.question_type === "multiple_choice" ? selectedOptionId || null : null;
      let cleanTextAnswer = null;

      if (
        question.question_type === "short_answer" && textAnswer !== undefined &&
        textAnswer !== null &&
        String(textAnswer).trim() !== ""
      ) {
        cleanTextAnswer = String(textAnswer).trim();
      }

      // 2. Gunakan UPSERT Supabase
      const { error } = await supabase.from("quiz_answers").upsert(
        {
          attempt_id: attemptId,
          question_id: questionId,
          selected_option_id: cleanSelectedOption,
          text_answer: cleanTextAnswer,
          answered_at: new Date().toISOString(),
        },
        { onConflict: "attempt_id,question_id" }
      );

      if (error) {
        console.error("Supabase autosave error:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to save answer",
        });
      }

      return res.json({
        success: true,
        message: "Answer saved successfully",
      });
    } catch (error) {
      console.error("Autosave endpoint error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

export default router;
