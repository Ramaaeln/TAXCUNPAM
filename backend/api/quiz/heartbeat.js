import express from "express";

import { supabase }
from "../lib/supabase.js";

import {
  verifyParticipant
}
from "../middleware/auth.js";

import {
  checkQuizTimer
}
from "../middleware/checkQuizTimer.js";

const router =
  express.Router();

router.post(
  "/",

  verifyParticipant,

  checkQuizTimer,

  async (req, res) => {

    try {

      const attemptId =
        req.user.attemptId;


      if (!attemptId) {

        return res.status(401).json({
          success: false,
          message:
            "Invalid participant token"
        });
      }

    
      const { error } =
        await supabase
          .from(
            "quiz_attempts"
          )
          .update({
            last_heartbeat:
              new Date()
          })
          .eq(
            "id",
            attemptId
          );

      if (error) {

        console.error(error);

        return res.status(500).json({
          success: false,
          message:
            "Failed update heartbeat"
        });
      }

    
      return res.json({
        success: true
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