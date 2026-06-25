import express from "express";
import { supabase } from "../lib/supabase.js";
import { verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/:attemptId", verifyAdmin, async (req, res) => {
  try {
    const { attemptId } = req.params;

    // 1. Ambil data jawaban peserta beserta relasi teks soal dan opsinya
    const { data: answers, error: answersError } = await supabase
      .from("quiz_answers")
      .select(`
        id,
        question_id,
        selected_option_id,
        text_answer,
        questions (
          question_text,
          question_type,
          short_answer,
          points
        )
      `)
      .eq("attempt_id", attemptId);

    if (answersError) throw answersError;

    // 2. Ambil semua opsi pilihan ganda secara global untuk dicocokkan nanti di frontend
    const { data: options, error: optionsError } = await supabase
      .from("question_options")
      .select("id, question_id, option_text, is_correct");

    if (optionsError) throw optionsError;

    return res.json({
      success: true,
      answers: answers || [],
      allOptions: options || []
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data review jawaban peserta",
    });
  }
});

export default router;