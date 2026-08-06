import express from "express";
import { supabase } from "../lib/supabase.js";
import { verifyParticipant } from "../middleware/auth.js";
import { checkQuizTimer } from "../middleware/checkQuizTimer.js";

const router = express.Router();

router.get("/:quizId", verifyParticipant, checkQuizTimer, async (req, res) => {
  try {
    const { quizId } = req.params;

    // 1. OPSI KEAMANAN: Pastikan quizId sesuai dengan token peserta
    if (req.user?.quizId && req.user.quizId !== quizId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Anda tidak memiliki akses ke kuis ini",
      });
    }

    // 2. Query Soal & Opsi Jawaban (Tanpa Kunci Jawaban)
    const { data: questions, error } = await supabase
      .from("questions")
      .select(`
        id,
        question_text,
        question_type,
        points,
        order_number,
        question_options (
          id,
          option_text,
          order_number
        )
      `)
      .eq("quiz_id", quizId)
      .is("deleted_at", null)
      .order("order_number", { ascending: true });

    if (error) {
      console.error("Fetch questions DB error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch questions",
      });
    }

    // 3. Urutkan Opsi Jawaban secara rapi berdasarkan order_number di Javascript
    const formattedQuestions = (questions || []).map((q) => {
      if (q.question_options && Array.isArray(q.question_options)) {
        q.question_options.sort(
          (a, b) => (a.order_number || 0) - (b.order_number || 0)
        );
      }
      return q;
    });

    return res.json({
      success: true,
      questions: formattedQuestions,
    });
  } catch (error) {
    console.error("Questions endpoint error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;