import express from "express";

import { supabase }
from "../lib/supabase.js";

import {
  verifyAdmin
} from "../middleware/auth.js";

const router =
  express.Router();



router.get(
  "/",

  verifyAdmin,

  async (req, res) => {

    try {

      const {
        data,
        error,
      } = await supabase

        .from(
          "quiz_attempts"
        )

        .select(`
          id,
          participant_name,
          score,
          status,
          violation_count,
          fullscreen_violations,
          tab_switch_violations,
          blur_violations,
          devtools_violations,
          started_at,
          submitted_at,
          quizzes (
            title
          )
        `)

        .order(
          "started_at",
          {
            ascending: false
          }
        );



      if (error) {

        return res
          .status(500)
          .json({
            success: false,
            message:
              error.message,
          });
      }



      return res.json({
        success: true,
        participants:
          data,
      });

    } catch (error) {

      console.error(
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Internal server error",
        });
    }
  }
);

export default router;