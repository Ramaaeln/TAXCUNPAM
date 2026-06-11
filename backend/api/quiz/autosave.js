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

      const {
        questionId,
        selectedOptionId,
        textAnswer
      } = req.body;

      const attemptId =
        req.user.attemptId;

      if (!questionId) {
        return res.status(400).json({
          success: false,
          message: "Question ID required",
        });
      }

      const { data: existingAnswer } =
        await supabase
          .from("quiz_answers")
          .select("*")
          .eq("attempt_id", attemptId)
          .eq("question_id", questionId)
          .maybeSingle();

      const payload = {
        answered_at: new Date(),
        selected_option_id:
          selectedOptionId || null,
        text_answer:
          textAnswer || null,
      };

      if (existingAnswer) {

        await supabase
          .from("quiz_answers")
          .update(payload)
          .eq("id", existingAnswer.id);

      } else {

        await supabase
          .from("quiz_answers")
          .insert({
            attempt_id: attemptId,
            question_id: questionId,
            ...payload,
          });
      }

      return res.json({
        success: true,
        message: "Answer saved",
      });

    } catch (error) {

      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

export default router;
