import express from "express";
import { supabase } from "../lib/supabase.js";
import { verifyParticipant } from "../middleware/auth.js";

const router = express.Router();

router.post("/", verifyParticipant, async (req, res) => {
  try {
    const attemptId = req.user?.attemptId;
    const { violationType, description } = req.body;

    if (!attemptId) {
      return res.status(401).json({
        success: false,
        message: "Invalid participant token",
      });
    }

    if (!violationType) {
      return res.status(400).json({
        success: false,
        message: "Violation type required",
      });
    }

    const allowedViolationTypes = [
      "tab_switch",
      "blur",
      "fullscreen_exit",
      "devtools",
    ];

    if (!allowedViolationTypes.includes(violationType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid violation type",
      });
    }

    // =====================================================
    // 1. Ambil attempt peserta
    // =====================================================
    const { data: attempt, error: attemptError } = await supabase
      .from("quiz_attempts")
      .select("*")
      .eq("id", attemptId)
      .maybeSingle();

    if (attemptError) {
      console.error("Failed loading attempt:", attemptError);

      return res.status(500).json({
        success: false,
        message: "Failed loading attempt",
      });
    }

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found",
      });
    }

    // =====================================================
    // 2. Kalau attempt sudah selesai, jangan catat violation lagi
    // =====================================================
    const finishedStatuses = [
      "submitted",
      "disqualified",
      "auto_submitted",
      "timeout",
    ];

    if (finishedStatuses.includes(attempt.status)) {
      const isDisqualified =
        attempt.status === "disqualified" ||
        attempt.status === "auto_submitted";

      return res.json({
        success: true,
        message: "Attempt already finished",

        autoSubmitted: isDisqualified,
        disqualified: isDisqualified,

        status: attempt.status,
        disqualifiedReason: attempt.disqualified_reason ?? null,
      });
    }

    // =====================================================
    // 3. Ambil settings quiz
    // =====================================================
    const { data: settings, error: settingsError } = await supabase
      .from("quiz_settings")
      .select("*")
      .eq("quiz_id", attempt.quiz_id)
      .maybeSingle();

    if (settingsError) {
      console.error("Failed loading quiz settings:", settingsError);

      return res.status(500).json({
        success: false,
        message: "Failed loading quiz settings",
      });
    }

    // Gunakan ?? supaya nilai 0 tetap valid, beri batas toleransi default yang wajar
    const maxTabSwitch = settings?.max_tab_switch ?? 3;
    const maxBlur = settings?.max_blur ?? 3;
    const maxFullscreen = settings?.max_fullscreen ?? 3;
    const maxDevtools = settings?.max_devtools ?? 3;

    // =====================================================
    // 4. Hitung violation berikutnya
    // =====================================================
    const currentViolationCount = attempt.violation_count ?? 0;

    const currentTabSwitch = attempt.tab_switch_violations ?? 0;
    const currentBlur = attempt.blur_violations ?? 0;
    const currentFullscreen = attempt.fullscreen_violations ?? 0;
    const currentDevtools = attempt.devtools_violations ?? 0;

    const updateData = {
      violation_count: currentViolationCount + 1,
    };

    if (violationType === "tab_switch") {
      updateData.tab_switch_violations = currentTabSwitch + 1;
    }

    if (violationType === "blur") {
      updateData.blur_violations = currentBlur + 1;
    }

    if (violationType === "fullscreen_exit") {
      updateData.fullscreen_violations = currentFullscreen + 1;
    }

    if (violationType === "devtools") {
      updateData.devtools_violations = currentDevtools + 1;
    }

    // =====================================================
    // 5. Tentukan apakah harus auto-submit
    // =====================================================
    let shouldAutoSubmit = false;

    if (
      violationType === "tab_switch" &&
      updateData.tab_switch_violations >= maxTabSwitch
    ) {
      shouldAutoSubmit = true;
    }

    if (
      violationType === "blur" &&
      updateData.blur_violations >= maxBlur
    ) {
      shouldAutoSubmit = true;
    }

    if (
      violationType === "fullscreen_exit" &&
      updateData.fullscreen_violations >= maxFullscreen
    ) {
      shouldAutoSubmit = true;
    }

    if (
      violationType === "devtools" &&
      updateData.devtools_violations >= maxDevtools
    ) {
      shouldAutoSubmit = true;
    }

    // =====================================================
    // 6. Catat violation log
    // =====================================================
    const { error: logError } = await supabase
      .from("violation_logs")
      .insert({
        attempt_id: attemptId,
        violation_type: violationType,
        description: description || null,
        created_at: new Date().toISOString(),
      });

    if (logError) {
      console.error("Failed inserting violation log:", logError);

      return res.status(500).json({
        success: false,
        message: "Failed saving violation log",
      });
    }

    // =====================================================
    // 7. Kalau kena batas, tandai disqualified
    // =====================================================
    if (shouldAutoSubmit) {
      updateData.status = "disqualified";
      updateData.auto_submitted = true;
      updateData.submitted_at = new Date().toISOString();
      updateData.disqualified_reason = violationType;
    }

    // =====================================================
    // 8. Update attempt
    // =====================================================
    const { error: updateError } = await supabase
      .from("quiz_attempts")
      .update(updateData)
      .eq("id", attemptId);

    if (updateError) {
      console.error("Failed updating attempt:", updateError);

      return res.status(500).json({
        success: false,
        message: "Failed updating attempt",
      });
    }

    // =====================================================
    // 9. Response
    // =====================================================
    return res.json({
      success: true,

      autoSubmitted: shouldAutoSubmit,
      disqualified: shouldAutoSubmit,

      disqualifiedReason: shouldAutoSubmit
        ? violationType
        : null,

      violationType,
      violationCount: updateData.violation_count,

      violations: {
        tabSwitch:
          updateData.tab_switch_violations ??
          currentTabSwitch,

        blur:
          updateData.blur_violations ??
          currentBlur,

        fullscreen:
          updateData.fullscreen_violations ??
          currentFullscreen,

        devtools:
          updateData.devtools_violations ??
          currentDevtools,
      },
    });
  } catch (error) {
    console.error(
      "Violation endpoint internal error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;