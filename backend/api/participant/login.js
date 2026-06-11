import express from "express";

import jwt from "jsonwebtoken";

import { supabase }
from "../lib/supabase.js";

const router = express.Router();



// ==========================================
// PARTICIPANT LOGIN
// ==========================================

router.post(
  "/",

  async (req, res) => {

    try {

      const {
        token,
        participant_name
      } = req.body;



      // ==========================================
      // VALIDATION
      // ==========================================

      if (
        !token ||
        !participant_name
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Token and name required"
        });
      }



      // ==========================================
      // FIND TOKEN
      // ==========================================

      const {
        data: tokenData,
        error: tokenError
      } = await supabase
        .from("quiz_tokens")
        .select("*")
        .eq(
          "token_hash",
          token
        )
        .single();



      if (
        tokenError ||
        !tokenData
      ) {

        return res.status(404).json({
          success: false,
          message:
            "Invalid token"
        });
      }



      // ==========================================
      // CHECK USED
      // ==========================================

      if (
        tokenData.is_used
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Token already used"
        });
      }



      // ==========================================
      // CHECK EXPIRED
      // ==========================================

      if (
        new Date(
          tokenData.expires_at
        ) < new Date()
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Token expired"
        });
      }



      // ==========================================
      // CREATE ATTEMPT
      // ==========================================

      const {
        data: attempt,
        error: attemptError
      } = await supabase
        .from("quiz_attempts")
        .insert([
          {
            quiz_id:
              tokenData.quiz_id,

            token_id:
              tokenData.id,

            participant_name,

            status:
              "in_progress",

            started_at:
              new Date(),

            ip_address:
              req.ip,

            user_agent:
              req.headers[
                "user-agent"
              ]
          }
        ])
        .select()
        .single();



      if (attemptError) {

        console.error(
          attemptError
        );

        return res.status(500).json({
          success: false,
          message:
            "Failed create attempt"
        });
      }



      // ==========================================
      // MARK TOKEN USED
      // ==========================================

      await supabase
        .from("quiz_tokens")
        .update({
          is_used: true,
          used_by_attempt:
            attempt.id,
          usage_count: 1
        })
        .eq(
          "id",
          tokenData.id
        );



      // ==========================================
      // JWT
      // ==========================================

      const accessToken =
        jwt.sign(
          {
            attempt_id:
              attempt.id,

            quiz_id:
              tokenData.quiz_id,

            role:
              "participant"
          },

          process.env.JWT_SECRET,

          {
            expiresIn: "12h"
          }
        );



      // ==========================================
      // SUCCESS
      // ==========================================

      return res.json({
        success: true,

        accessToken,

        quiz_id:
          tokenData.quiz_id,

        attempt_id:
          attempt.id
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