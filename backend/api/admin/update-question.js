import express from "express";

import { supabase } from "../lib/supabase.js";

import { verifyAdmin } from "../middleware/auth.js";
import { validateQuestion } from "../utils/questionValidation.js";

const router = express.Router();

router.put(
  "/:id",

  verifyAdmin,

  async (req, res) => {
    try {
      const validationError = validateQuestion(req.body);
      if (validationError) return res.status(400).json({ success: false, message: validationError });
      const id = req.params.id;

      const {
        question_text,

        question_type,

        points,

        options,

        correct_option,

        short_answer,
      } = req.body;

      const { error: questionError } = await supabase

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
      if (questionError) throw questionError;

      const { error: deleteError } = await supabase

        .from("question_options")

        .delete()

        .eq(
          "question_id",

          id,
        );
      if (deleteError) throw deleteError;

      if (question_type === "multiple_choice") {
        const { error: optionsError } = await supabase

          .from("question_options")

          .insert(
            options.map((opt, index) => ({
              question_id: id,

              option_text: opt,

              is_correct: index === correct_option,

              order_number: index + 1,
            })),
          );
        if (optionsError) throw optionsError;
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
