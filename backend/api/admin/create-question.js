import express from "express";
import { supabase } from "../lib/supabase.js";

import { verifyAdmin } from "../middleware/auth.js";
import { validateQuestion } from "../utils/questionValidation.js";

const router = express.Router();

router.post(
  "/",

  verifyAdmin,

  async (req, res) => {
    try {
      const validationError = validateQuestion(req.body);
      if (validationError) return res.status(400).json({ success: false, message: validationError });
      const {
        quiz_id,
        question_text,
        question_type,

        points,

        options,

        correct_option,

        short_answer,
      } = req.body;

      // VALIDATION

      if (!quiz_id || !question_text || !question_type) {
        return res
          .status(400)

          .json({
            message: "Required",
          });
      }

      // CREATE QUESTION

      const { data: question, error } = await supabase

        .from("questions")

        .insert([
          {
            quiz_id,

            question_text,

            question_type,

            points: points || 10,

            short_answer:
              question_type === "short_answer" ? short_answer : null,
          },
        ])

        .select()

        .single();

      if (error) throw error;

      // CREATE OPTION

      if (question_type === "multiple_choice") {
        const payload = options.map((opt, index) => ({
          question_id: question.id,

          option_text: opt,

          order_number: index + 1,

          is_correct: index === correct_option,
        }));

        const { error: optionsError } = await supabase

          .from("question_options")

          .insert(payload);
        if (optionsError) {
          await supabase.from("questions").update({ deleted_at: new Date().toISOString() }).eq("id", question.id);
          throw optionsError;
        }
      }

      res.json({
        success: true,

        question,
      });
    } catch (err) {
      console.log(err);

      res.status(500).json({
        message: "Internal error",
      });
    }
  },
);

export default router;
