import express from "express";

import { supabase }
from "../lib/supabase.js";

const router = express.Router();



router.get(
  "/:quizId",

  async (req, res) => {

    try {

      const { quizId } = req.params;



      // ==========================================
      // GET LEADERBOARD
      // ==========================================

      const {
        data,
        error
      } = await supabase
        .from("leaderboard_view")
        .select("*")
        .eq("quiz_id", quizId)
        .order("score", {
          ascending: false
        })
        .order("duration_seconds", {
          ascending: true
        });



      if (error) {

        console.error(error);

        return res.status(500).json({
          success: false,
          message: "Failed to fetch leaderboard"
        });
      }



      // ==========================================
      // ADD RANKING
      // ==========================================

      const leaderboard =
        data.map((item, index) => ({
          rank: index + 1,
          ...item
        }));



      // ==========================================
      // SUCCESS
      // ==========================================

      return res.json({
        success: true,
        leaderboard
      });

    } catch (error) {

      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }
);

export default router;