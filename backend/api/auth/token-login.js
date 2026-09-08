import express from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { supabase } from "../lib/supabase.js";
import { hashToken } from "../utils/hash.js";
import { finalizeAttempt } from "../utils/finalizeAttempt.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { token, participantName, participantEmail } = req.body || {};
    const rawParticipantName = participantName || req.body?.participant_name;

    // ==========================================
    // VALIDATION
    // ==========================================
    if (typeof token !== "string" || !token.trim() || token.length > 128 ||
        typeof rawParticipantName !== "string" || !rawParticipantName.trim() || rawParticipantName.length > 200 ||
        (participantEmail != null && (typeof participantEmail !== "string" || participantEmail.length > 254))) {
      return res.status(400).json({
        success: false,
        message: "Token and participant name are required",
      });
    }

    // ==========================================
    // CLEAN INPUT (Uppercased Token for consistency)
    // ==========================================
    const cleanToken = token.trim().toUpperCase();
    const cleanName = rawParticipantName.trim();
    const tokenHash = hashToken(cleanToken);

    // ==========================================
    // FIND TOKEN (SAFE QUERY)
    // ==========================================
    const { data: quizToken, error: tokenError } = await supabase
      .from("quiz_tokens")
      .select("*")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    // DB ERROR
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
        token_input: `sha256:${tokenHash}`,
        ip_address: req.ip,
        user_agent: req.headers["user-agent"],
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
    if (quizToken.expires_at && new Date(quizToken.expires_at) < new Date()) {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    // ==========================================
    // CHECK EXISTING ATTEMPT (RECOVERY & COMPLETED CHECK)
    // ==========================================
    // Cek apakah ada attempt aktif (in_progress) milik token ini yang siap dipulihkan
    const { data: activeAttempt, error: activeAttemptError } = await supabase
      .from("quiz_attempts")
      .select("*, quizzes(duration_minutes)")
      .eq("token_id", quizToken.id)
      .eq("status", "in_progress")
      .maybeSingle();

    if (activeAttemptError) throw activeAttemptError;

    let targetAttemptId = null;
    let actualStartedAt = null;

    if (activeAttempt) {
      // Cek apakah waktu attempt aktif ini sebenarnya sudah habis di server
      const startedAt = new Date(activeAttempt.started_at);
      const durationMs = Number(activeAttempt.quizzes?.duration_minutes) * 60 * 1000;
      if (!Number.isFinite(durationMs) || durationMs <= 0 || !Number.isFinite(startedAt.getTime())) throw new Error("Invalid quiz timer");
      const gracePeriodMs = 15 * 1000;
      const endTime = new Date(startedAt.getTime() + durationMs + gracePeriodMs);

      if (new Date() > endTime) {
        // Tandai attempt sebagai timeout di database
        await finalizeAttempt(activeAttempt, "timeout");

        return res.status(401).json({
          success: false,
          message: "Waktu pengerjaan kuis untuk token ini telah berakhir.",
        });
      }

      // ------------------------------------------
      // JALUR A: RECOVERY (Peserta Melanjutkan Ujian / Sesi Di-reset Admin)
      // ------------------------------------------
      targetAttemptId = activeAttempt.id;

      // PENTING: Ambil started_at resmi yang sudah dihitung ulang oleh Admin saat Reset Session
      actualStartedAt = activeAttempt.started_at;

      // Nonaktifkan semua sesi lama di participant_sessions agar tidak bentrok
      const { error: expireError } = await supabase
        .from("participant_sessions")
        .update({
          is_active: false,
          expired_at: new Date().toISOString(),
        })
        .eq("attempt_id", targetAttemptId)
        .eq("is_active", true);
      if (expireError) throw expireError;

    } else {
      // ------------------------------------------
      // JALUR B: ENTRY BARU (Peserta Pertama Kali Masuk)
      // ------------------------------------------
      
      // Jika attempt baru, WAJIB cek apakah token ini sudah pernah digunakan
      const isUsed = quizToken.is_used;
      const usageCount = quizToken.usage_count || 0;
      const maxUsage = quizToken.max_usage || 1;

      if (isUsed || usageCount >= maxUsage) {
        // Cek apakah kuis dengan token ini sudah selesai
        const { data: completedAttempt } = await supabase
          .from("quiz_attempts")
          .select("*")
          .eq("token_id", quizToken.id)
          .in("status", ["submitted", "auto_submitted", "timeout", "disqualified"])
          .maybeSingle();

        if (completedAttempt) {
          return res.status(401).json({
            success: false,
            message: "Token ini sudah digunakan dan kuis telah selesai. Silakan gunakan token baru.",
          });
        }

        return res.status(401).json({
          success: false,
          message: "Token ini sudah pernah digunakan. Harap minta token baru kepada panitia.",
        });
      }

      const nowIso = new Date().toISOString();

      // Buat Attempt Baru
      const { data: newAttempt, error: attemptError } = await supabase
        .from("quiz_attempts")
        .insert({
          quiz_id: quizToken.quiz_id,
          token_id: quizToken.id,
          participant_name: cleanName,
          participant_email: participantEmail ? participantEmail.trim() : null,
          status: "in_progress",
          started_at: nowIso,
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

      targetAttemptId = newAttempt.id;
      actualStartedAt = newAttempt.started_at || nowIso;

      // Update Token Usage
      await supabase
        .from("quiz_tokens")
        .update({
          usage_count: usageCount + 1,
          is_used: true,
          used_by_attempt: targetAttemptId,
        })
        .eq("id", quizToken.id);
    }

    // ==========================================
    // CREATE NEW ACTIVE SESSION
    // ==========================================
    const sessionToken = crypto.randomBytes(32).toString("hex");

    const { data: newSession, error: sessionErr } = await supabase
      .from("participant_sessions")
      .insert({
        attempt_id: targetAttemptId,
        session_token: sessionToken,
        ip_address: req.ip,
        user_agent: req.headers["user-agent"],
        is_active: true,
      })
      .select()
      .single();

    if (sessionErr) {
      console.error("Session create error:", sessionErr);
      return res.status(500).json({
        success: false,
        message: "Failed to create participant session",
      });
    }

    // LOG SUCCESSFUL ATTEMPT
    await supabase.from("token_attempt_logs").insert({
      token_input: `sha256:${tokenHash}`,
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
      success: true,
    });

    // ==========================================
    // JWT GENERATION
    // ==========================================
    const accessToken = jwt.sign(
      {
        attemptId: targetAttemptId,
        sessionId: newSession.id,
        quizId: quizToken.quiz_id,
        role: "participant",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "25h",
      }
    );

    // ==========================================
    // RESPONSE DENGAN STARTED_AT RECOVERY
    // ==========================================
    return res.json({
      success: true,
      isRecovery: !!activeAttempt,
      accessToken,
      attemptId: targetAttemptId,
      quizId: quizToken.quiz_id,
      startedAt: actualStartedAt, // <--- DIKIRIMKAN LANGSUNG KE FRONTEND
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
