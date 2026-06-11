import express from "express";

import { supabase }
from "../lib/supabase.js";

import {
  verifyAdmin
} from "../middleware/auth.js";

const router = express.Router();



// ==========================================
// GET ALL QUIZZES
// ==========================================

router.get(
  "/",

  verifyAdmin,

  async (req, res) => {

    try {

      const {
        data,
        error
      } = await supabase
        .from("quizzes")
        .select(`
          id,
          title,
          duration_minutes,
          is_active,
          created_at
        `)
        .order(
          "created_at",
          {
            ascending: false
          }
        );



      if (error) {

        console.error(error);

        return res.status(500).json({
          success: false,
          message:
            "Failed fetch quizzes"
        });
      }



      return res.json({
        success: true,
        quizzes: data
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