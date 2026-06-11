import express from "express";
import { supabase } from "../lib/supabase.js";
import {verifyAdmin} from "../middleware/auth.js";

const router = express.Router();

router.get(
  "/",

  verifyAdmin,

  async (req, res) => {
    try {
      // TOTAL QUIZ
      const { count: totalQuiz } = await supabase.from("quizzes").select("*", {
        count: "exact",
        head: true,
      });

      // TOTAL PARTICIPANTS

      const { count: participants } = await supabase
        .from("quiz_attempts")
        .select("*", {
          count: "exact",
          head: true,
        });

      // TOTAL VIOLATION

      const { count: violations } = await supabase
        .from("violation_logs")
        .select("*", {
          count: "exact",
          head: true,
        });

      // TOTAL SUBMISSION

      const { count: submissions } = await supabase
        .from("quiz_attempts")
        .select("*", {
          count: "exact",
          head: true,
        })

        .eq("status", "submitted");

      // ACTIVE QUIZ

      const { count: activeQuiz } = await supabase
        .from("quizzes")

        .select("*", {
          count: "exact",
          head: true,
        })

        .eq("is_active", true);

      res.json({
        totalQuiz,

        participants,

        violations,

        submissions,

        activeQuiz,
      });
    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  },
);

export default router;
