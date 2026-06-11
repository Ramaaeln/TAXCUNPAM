import express from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { supabase } from "../lib/supabase.js";
import { hashToken } from "../utils/hash.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const {
      token,
      participantName,
    } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================
    if (!token || !participantName) {
      return res.status(400).json({
        success: false,
        message: "Token and participant name are required",
      });
    }

    // ==========================================
    // CLEAN INPUT
    // ==========================================
    const cleanToken = token.trim();
    const tokenHash = hashToken(cleanToken);

    // ==========================================
    // FIND TOKEN (SAFE QUERY)
    // ==========================================
    const { data: quizToken, error: tokenError } = await supabase
      .from("quiz_tokens")
      .select("*")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    // DB ERROR (bukan invalid token)
    if (tokenError) {
      console.error("Supabase token query error:", tokenError);

      return res.status(500).json({
        success: false,
        message: "Database error while validating token",
      });
    }

    // TOKEN NOT FOUND
    if (!quizToken) {
      await supabase.from("token_attempt_logs").insert({
        token_input: cleanToken,
        success: false,
      });

      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    // ==========================================
    // CHECK EXPIRED
    // ==========================================
    if (new Date(quizToken.expires_at) < new Date()) {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    // ==========================================
    // CHECK USAGE
    // ==========================================
    if (quizToken.usage_count >= quizToken.max_usage) {
      return res.status(401).json({
        success: false,
        message: "Token already used",
      });
    }

    // ==========================================
    // CREATE ATTEMPT
    // ==========================================
    const { data: attempt, error: attemptError } = await supabase
      .from("quiz_attempts")
      .insert({
        quiz_id: quizToken.quiz_id,
        token_id: quizToken.id,
        participant_name: participantName,
        status: "in_progress",
        ip_address: req.ip,
        user_agent: req.headers["user-agent"],
      })
      .select()
      .single();

    if (attemptError) {
      console.error("Attempt create error:", attemptError);

      return res.status(500).json({
        success: false,
        message: "Failed to create attempt",
      });
    }

    // ==========================================
    // UPDATE TOKEN USAGE
    // ==========================================
    await supabase
      .from("quiz_tokens")
      .update({
        usage_count: quizToken.usage_count + 1,
        is_used: true,
        used_by_attempt: attempt.id,
      })
      .eq("id", quizToken.id);

    // ==========================================
    // CREATE SESSION
    // ==========================================
    const sessionToken = crypto.randomBytes(32).toString("hex");

    await supabase.from("participant_sessions").insert({
      attempt_id: attempt.id,
      session_token: sessionToken,
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
    });

    // ==========================================
    // JWT GENERATION
    // ==========================================
    const accessToken = jwt.sign(
      {
        attemptId: attempt.id,
        quizId: quizToken.quiz_id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "2h",
      }
    );

    // ==========================================
    // RESPONSE
    // ==========================================
    return res.json({
      success: true,
      accessToken,
      attemptId: attempt.id,
      quizId: quizToken.quiz_id,
    });
  } catch (error) {
    console.error("INTERNAL ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;