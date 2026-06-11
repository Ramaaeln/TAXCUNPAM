import express from "express";

import jwt from "jsonwebtoken";

import { supabase }
from "../lib/supabase.js";

const router =
  express.Router();

router.get(
  "/",

  async (req, res) => {

    try {

      const authHeader =
        req.headers.authorization;

      if (!authHeader) {

        return res
          .status(401)
          .json({
            success: false,
            message:
              "Unauthorized",
          });
      }

      const token =
        authHeader.split(
          " "
        )[1];

      const decoded =
        jwt.verify(
          token,
          process.env.JWT_SECRET
        );

      const attemptId =
        decoded.attemptId;

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
          total_questions,
          correct_answers,
          wrong_answers,
          unanswered,
          started_at,
          submitted_at,
          quizzes (
            title
          )
        `)

        .eq(
          "id",
          attemptId
        )

        .single();

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
        result: data,
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