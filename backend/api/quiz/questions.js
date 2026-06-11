import express from "express";

import { supabase }
from "../lib/supabase.js";

import { verifyParticipant }
from "../middleware/auth.js";
import {
  checkQuizTimer
}
from "../middleware/checkQuizTimer.js";
const router = express.Router();



router.get(
  "/:quizId",
  verifyParticipant,
checkQuizTimer,
  async (req, res) => {

    try {

      const { quizId } = req.params;

      const {
        data: questions,
        error
      } = await supabase
        .from("questions")
        .select(`
          id,
          question_text,
          question_type,
          points,
          order_number,

          question_options (
            id,
            option_text,
            order_number
          )
        `)
        .eq("quiz_id", quizId)
        .is("deleted_at", null)
        .order("order_number", {
          ascending: true
        });



      if (error) {

        console.error(error);

        return res.status(500).json({
          success: false,
          message: "Failed to fetch questions"
        });
      }


      return res.json({
        success: true,
        questions
      });

    } catch (error) {

      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }
);

export default router;