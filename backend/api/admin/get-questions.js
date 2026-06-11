import express from "express";

import { supabase } from "../lib/supabase.js";

import { verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get(
  "/:quizId",

  verifyAdmin,

  async (req, res) => {
    try {
      const { quizId } = req.params;

      const { data, error } = await supabase

        .from("questions")

        .select(
          `

*,

question_options(
*
)

`,
        )

        .eq(
          "quiz_id",

          quizId,
        )

        .is(
          "deleted_at",

          null,
        )

        .order("order_number");

      if (error) throw error;

      res.json({
        success: true,

        questions: data,
      });
    } catch (err) {
      res
        .status(500)

        .json({
          message: "Error",
        });
    }
  },
);

export default router;
