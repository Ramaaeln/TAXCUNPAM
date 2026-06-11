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

      const {
        data: attempt,
        error:
          attemptError,
      } = await supabase

        .from(
          "quiz_attempts"
        )

        .select("*")

        .eq(
          "id",
          decoded.attemptId
        )

        .single();



      if (
        attemptError ||
        !attempt
      ) {

        return res
          .status(404)
          .json({
            success: false,
            message:
              "Attempt not found",
          });
      }

      const {
        data: answers,
      } = await supabase

        .from(
          "quiz_answers"
        )

        .select(
          `
          question_id,
          selected_option_id
        `
        )

        .eq(
          "attempt_id",
          attempt.id
        );



      return res.json({
        success: true,

        attempt,

        answers,
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