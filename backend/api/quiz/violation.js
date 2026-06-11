import express from "express";

import { supabase }
from "../lib/supabase.js";

import { verifyParticipant }
from "../middleware/auth.js";

const router = express.Router();

router.post(
  "/",

  verifyParticipant,

  async (req, res) => {

    try {

      const attemptId =
        req.user.attemptId;

      const {
        violationType,
        description
      } = req.body;

      if (!attemptId) {

        return res.status(401).json({
          success: false,
          message:
            "Invalid participant token"
        });
      }

      if (!violationType) {

        return res.status(400).json({
          success: false,
          message:
            "Violation type required"
        });
      }

      const {
        data: attempt,
        error: attemptError
      } = await supabase

        .from("quiz_attempts")

        .select("*")

        .eq("id", attemptId)

        .single();

      if (
        attemptError ||
        !attempt
      ) {

        return res.status(404).json({
          success: false,
          message:
            "Attempt not found"
        });
      }

      if (
        [
          "submitted",
          "disqualified",
          "auto_submitted",
          "timeout"
        ].includes(
          attempt.status
        )
      ) {

        return res.json({
          success: true,
          message:
            "Attempt already finished"
        });
      }

      await supabase

        .from("violation_logs")

        .insert({

          attempt_id:
            attemptId,

          violation_type:
            violationType,

          description,

          created_at:
            new Date()
        });

      const updateData = {

        violation_count:
          (
            attempt.violation_count || 0
          ) + 1
      };

      if (
        violationType ===
        "tab_switch"
      ) {

        updateData
          .tab_switch_violations =

          (
            attempt.tab_switch_violations || 0
          ) + 1;
      }

      if (
        violationType ===
        "blur"
      ) {

        updateData
          .blur_violations =

          (
            attempt.blur_violations || 0
          ) + 1;
      }

      if (
        violationType ===
        "fullscreen_exit"
      ) {

        updateData
          .fullscreen_violations =

          (
            attempt.fullscreen_violations || 0
          ) + 1;
      }

      if (
        violationType ===
        "devtools"
      ) {

        updateData
          .devtools_violations =

          (
            attempt.devtools_violations || 0
          ) + 1;
      }

      const {
        data: settings
      } = await supabase

        .from("quiz_settings")

        .select("*")

        .eq(
          "quiz_id",
          attempt.quiz_id
        )

        .maybeSingle();

      let shouldAutoSubmit =
        false;

      if (
        violationType ===
        "tab_switch" &&

        updateData
          .tab_switch_violations >=
        (
          settings
            ?.max_tab_switch || 1
        )
      ) {

        shouldAutoSubmit =
          true;
      }

      if (
        violationType ===
        "blur" &&

        updateData
          .blur_violations >=
        (
          settings
            ?.max_blur || 1
        )
      ) {

        shouldAutoSubmit =
          true;
      }

      if (
        violationType ===
        "fullscreen_exit"
      ) {

        shouldAutoSubmit =
          true;
      }

      if (
        violationType ===
        "devtools"
      ) {

        shouldAutoSubmit =
          true;
      }

      if (
        shouldAutoSubmit
      ) {

        updateData.status =
          "disqualified";

        updateData
          .auto_submitted =
          true;

        updateData
          .submitted_at =
          new Date();

        updateData
          .disqualified_reason =
          violationType;
      }

      const {
        error: updateError
      } = await supabase

        .from("quiz_attempts")

        .update(updateData)

        .eq("id", attemptId);

      if (updateError) {

        console.error(
          updateError
        );

        return res.status(500).json({
          success: false,
          message:
            "Failed update attempt"
        });
      }

      return res.json({

        success: true,

        autoSubmitted:
          shouldAutoSubmit,

        disqualified:
          shouldAutoSubmit,

        violationCount:
          updateData
            .violation_count
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