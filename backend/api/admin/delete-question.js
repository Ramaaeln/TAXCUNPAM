import express from "express";

import { supabase } from "../lib/supabase.js";

import { verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

router.delete(
  "/:id",

  verifyAdmin,

  async (req, res) => {
    try {
      await supabase

        .from("questions")

        .update({
          deleted_at: new Date(),
        })

        .eq(
          "id",

          req.params.id,
        );

      res.json({
        success: true,
      });
    } catch {
      res
        .status(500)

        .json({
          message: "Delete failed",
        });
    }
  },
);

export default router;
