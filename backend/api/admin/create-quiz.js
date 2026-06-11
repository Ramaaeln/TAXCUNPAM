import express from "express";

import { supabase }
from "../lib/supabase.js";

import {
  verifyAdmin
} from "../middleware/auth.js";

const router = express.Router();



router.post(
  "/",

  verifyAdmin,

  async (req, res) => {

    try {

      const {
        title,
        description,
        duration_minutes,
        start_time,
        end_time
      } = req.body;



      // ==========================================
      // VALIDATION
      // ==========================================

      if (
        !title ||
        !duration_minutes
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Title and duration required"
        });
      }



      // ==========================================
      // INSERT QUIZ
      // ==========================================

      const {
        data: quiz,
        error
      } = await supabase
        .from("quizzes")
        .insert([
          {
            title,
            description,
            duration_minutes,
            start_time,
            end_time,

            is_active: false,

            created_by:
              req.user.id
          }
        ])
        .select()
        .single();



      if (error) {

        console.error(error);

        return res.status(500).json({
          success: false,
          message:
            "Failed create quiz"
        });
      }



      // ==========================================
      // DEFAULT QUIZ SETTINGS
      // ==========================================

      await supabase
        .from("quiz_settings")
        .insert([
          {
            quiz_id: quiz.id,

            fullscreen_required:
              true,

            auto_submit_on_tab_switch:
              true,

            auto_submit_on_blur:
              true,

            auto_submit_on_fullscreen_exit:
              true,

            max_tab_switch: 1,

            max_blur: 1
          }
        ]);



      return res.json({
        success: true,
        quiz
      });

    } catch (error) {

      console.error(error);

      return res.status(500).json({
        success: false,
        message:
          "Internal server error"
      });
    }
  }
);

export default router;