import express from "express";
import jwt from "jsonwebtoken";
import { supabase } from "../lib/supabase.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token required",
      });
    }

    const { data: tokenData, error } = await supabase
      .from("quiz_tokens")
      .select("*")
      .eq("token_hash", token.trim())
      .maybeSingle();

    if (error || !tokenData) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (tokenData.is_used) {
      return res.status(403).json({
        success: false,
        message: "Token already used",
      });
    }

    if (
      tokenData.expires_at &&
      new Date(tokenData.expires_at) < new Date()
    ) {
      return res.status(403).json({
        success: false,
        message: "Token expired",
      });
    }

    const sessionExpires = new Date();
    sessionExpires.setMinutes(sessionExpires.getMinutes() + 60);

    const { data: session, error: sessionError } = await supabase
      .from("quiz_sessions")
      .insert({
        quiz_id: tokenData.quiz_id,
        token_id: tokenData.id,
        status: "in_progress",
        started_at: new Date().toISOString(),
        expires_at: sessionExpires.toISOString(),
        ip_address: req.ip,
        user_agent: req.headers["user-agent"],
        violation_count: 0,
      })
      .select()
      .single();

    if (sessionError) {
      return res.status(500).json({
        success: false,
        message: "Failed to create session",
      });
    }

    await supabase
      .from("quiz_tokens")
      .update({
        is_used: true,
        used_at: new Date().toISOString(),
      })
      .eq("id", tokenData.id);

    const sessionToken = jwt.sign(
      {
        session_id: session.id,
        quiz_id: tokenData.quiz_id,
        role: "participant",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    return res.json({
      success: true,
      sessionToken,
      sessionId: session.id,
      quizId: tokenData.quiz_id,
      expiresAt: sessionExpires.toISOString(),
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;