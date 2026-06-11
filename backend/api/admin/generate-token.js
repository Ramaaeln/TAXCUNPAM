import express from "express";
import crypto from "crypto";

import { supabase } from "../lib/supabase.js";
import { verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

// ==========================================
// HASH TOKEN
// ==========================================

function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

// ==========================================
// GENERATE TOKEN
// ==========================================

function generatePlainToken() {
  return (
    "TAXCUNPAM-" +
    crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase()
  );
}

// ==========================================
// GENERATE TOKENS ROUTE
// ==========================================

router.post(
  "/",
  verifyAdmin,

  async (req, res) => {

    try {

      const {
        quiz_id,
        count,
        expires_in_minutes = 1440
      } = req.body;

      // ==========================================
      // VALIDATION
      // ==========================================

      if (!quiz_id || !count) {

        return res.status(400).json({
          success: false,
          message:
            "quiz_id and count required"
        });
      }

      // ==========================================
      // GENERATE TOKENS
      // ==========================================

      const tokensToInsert = [];

      const plainTokens = [];

      for (let i = 0; i < count; i++) {

        const plainToken =
          generatePlainToken();

        const hashedToken =
          hashToken(plainToken);

        const expiresAt =
          new Date(
            Date.now() +
            expires_in_minutes *
            60 *
            1000
          );

        tokensToInsert.push({
          quiz_id,
          token_hash: hashedToken,
          expires_at: expiresAt
        });

        plainTokens.push({
          token: plainToken
        });
      }

      // ==========================================
      // INSERT DATABASE
      // ==========================================

      const {
        data,
        error
      } = await supabase
        .from("quiz_tokens")
        .insert(tokensToInsert)
        .select();

      if (error) {

        console.error(error);

        return res.status(500).json({
          success: false,
          message:
            "Failed generate tokens"
        });
      }

      // ==========================================
      // MERGE RESPONSE
      // ==========================================

      const responseTokens =
        data.map((item, index) => ({
          id: item.id,
          token:
            plainTokens[index].token,
          expires_at:
            item.expires_at
        }));

      return res.json({
        success: true,
        tokens: responseTokens
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