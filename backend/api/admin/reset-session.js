import express from "express";
import { supabase } from "../lib/supabase.js";
import { verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

router.post("/", verifyAdmin, async (req, res) => {
  try {
    const { attemptId, tokenId, customRemainingMinutes } = req.body;

    if (!attemptId) {
      return res.status(400).json({
        success: false,
        message: "Attempt ID wajib diisi",
      });
    }

    // Ambil data attempt & durasi kuis terlebih dahulu
    const { data: attempt, error: fetchError } = await supabase
      .from("quiz_attempts")
      .select("id, quiz_id, quizzes(duration_minutes)")
      .eq("id", attemptId)
      .maybeSingle();

    if (fetchError || !attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt atau Kuis tidak ditemukan",
      });
    }

    // Prepare payload update
    const updatePayload = {
      status: "in_progress",
      auto_submitted: false,
      submitted_at: null,
      disqualified_reason: null,
      violation_count: 0,
      tab_switch_violations: 0,
      blur_violations: 0,
      fullscreen_violations: 0,
      devtools_violations: 0,
    };

    // LOGIKA RECOVERY SISA WAKTU MENIT:
    // Jika customRemainingMinutes dikirim (misal 15 menit),
    // hitung mundur started_at agar sisa waktu di timer persis N menit.
    if (customRemainingMinutes !== undefined && customRemainingMinutes !== null && customRemainingMinutes !== "") {
      const remainingMins = Number(customRemainingMinutes);
      const quizDuration = attempt.quizzes?.duration_minutes || 60;
      if (!Number.isFinite(remainingMins) || remainingMins <= 0 || remainingMins > quizDuration) {
        return res.status(400).json({ success: false, message: "Sisa waktu harus lebih dari 0 dan tidak melebihi durasi kuis" });
      }

      // Hitung berapa ms yang sudah "seolah-olah" terpakai
      const elapsedMs = Math.max(0, (quizDuration - remainingMins) * 60 * 1000);
      const newStartedAt = new Date(Date.now() - elapsedMs).toISOString();

      updatePayload.started_at = newStartedAt;
    }

    // 1. Matikan sesi lama di participant_sessions
    await supabase
      .from("participant_sessions")
      .update({
        is_active: false,
        expired_at: new Date().toISOString(),
      })
      .eq("attempt_id", attemptId);

    // 2. Update status attempt dan started_at (jika di-custom)
    const { error: attemptUpdateError } = await supabase
      .from("quiz_attempts")
      .update(updatePayload)
      .eq("id", attemptId);

    if (attemptUpdateError) {
      console.error("Error updating quiz attempt:", attemptUpdateError);
      return res.status(500).json({
        success: false,
        message: "Gagal memperbarui status pengerjaan peserta",
      });
    }

    // 3. (Opsional) Kurangi usage_count token jika tokenId diberikan
    if (tokenId) {
      const { data: tokenData } = await supabase
        .from("quiz_tokens")
        .select("usage_count")
        .eq("id", tokenId)
        .maybeSingle();

      if (tokenData && tokenData.usage_count > 0) {
        await supabase
          .from("quiz_tokens")
          .update({ usage_count: tokenData.usage_count - 1 })
          .eq("id", tokenId);
      }
    }

    return res.json({
      success: true,
      message: `Sesi peserta berhasil di-reset${
        customRemainingMinutes ? ` dengan sisa waktu ${customRemainingMinutes} menit` : ""
      }. Peserta dapat masuk kembali.`,
    });
  } catch (error) {
    console.error("Reset session error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;
