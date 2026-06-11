import express from "express";

import { supabase }
from "../lib/supabase.js";

import { verifyParticipant }
from "../middleware/auth.js";

const router = express.Router();



router.get(
  "/:quizId",
  verifyParticipant,

  async (req, res) => {

    try {

      const { quizId } = req.params;



      const {
        data,
        error
      } = await supabase
        .from("quizzes")
        .select(`
          id,
          title,
          duration_minutes
        `)
        .eq("id", quizId)
        .single();



      if (error || !data) {

        return res.status(404).json({
          success: false,
          message: "Quiz not found"
        });
      }



      return res.json({
        success: true,
        quiz: data
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