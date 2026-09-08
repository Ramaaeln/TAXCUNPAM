import express from "express";

import { supabase } from "../lib/supabase.js";

import { verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

router.delete(
  "/:id",

  verifyAdmin,

  async (req, res) => {
    try {
      const { error } = await supabase

        .from("questions")

        .update({
          deleted_at: new Date(),
        })

        .eq(
          "id",

          req.params.id,
        );
      if (error) throw error;

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
