import express from "express";

import { supabase } from "../lib/supabase.js";

import { verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

router.put(
  "/:id",

  verifyAdmin,

  async (req, res) => {
    try {
      const id = req.params.id;

      const {
        question_text,

        question_type,

        points,

        options,

        correct_option,

        short_answer,
      } = req.body;

      await supabase

        .from("questions")

        .update({
          question_text,

          question_type,

          points,

          short_answer,
        })

        .eq(
          "id",

          id,
        );

      await supabase

        .from("question_options")

        .delete()

        .eq(
          "question_id",

          id,
        );

      if (question_type === "multiple_choice") {
        await supabase

          .from("question_options")

          .insert(
            options.map((opt, index) => ({
              question_id: id,

              option_text: opt,

              is_correct: index === correct_option,

              order_number: index + 1,
            })),
          );
      }

      res.json({
        success: true,
      });
    } catch {
      res
        .status(500)

        .json({
          message: "Update failed",
        });
    }
  },
);

export default router;
