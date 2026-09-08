import express from "express";
import { supabase } from "../lib/supabase.js";
import { verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", verifyAdmin, async (req, res) => {
  try {
    const { data: attempts, error } = await supabase
      .from("quiz_attempts")
      .select(`
        id,
        token_id,
        quiz_id,
        participant_name,
        score,
        status,
        auto_submitted,
        disqualified_reason,
        violation_count,
        fullscreen_violations,
        tab_switch_violations,
        blur_violations,
        devtools_violations,
        last_heartbeat,
        started_at,
        submitted_at,
        quizzes (
          id,
          title,
          duration_minutes
        )
      `)
      .order("started_at", { ascending: false });

    if (error) {
      console.error("Live monitor fetch error:", error);
      return res.status(500).json({
        success: false,
        message: "Gagal mengambil data live monitor",
      });
    }

    // Menghitung status online/offline peserta berdasarkan last_heartbeat (toleransi 30 detik)
    const now = new Date().getTime();
    const formattedData = (attempts || []).map((item) => {
      const lastBeat = item.last_heartbeat ? new Date(item.last_heartbeat).getTime() : 0;
      const isOnline = item.status === "in_progress" && now - lastBeat < 30000;

      return {
        ...item,
        is_online: isOnline,
      };
    });

    return res.json({
      success: true,
      participants: formattedData,
    });
  } catch (error) {
    console.error("Live monitor endpoint internal error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;
