import express from "express";
import { supabase } from "../lib/supabase.js";
import { verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/:attemptId", verifyAdmin, async (req, res) => {
  try {
    const { attemptId } = req.params;

    if (!attemptId) {
      return res.status(400).json({
        success: false,
        message: "Attempt ID wajib diisi",
      });
    }

    // 1. Ambil data attempt peserta
    const { data: attempt, error: attemptError } = await supabase
      .from("quiz_attempts")
      .select(`
        id,
        quiz_id,
        participant_name,
        score,
        total_questions,
        correct_answers,
        wrong_answers,
        unanswered,
        status,
        submitted_at,
        quizzes (
          id,
          title
        )
      `)
      .eq("id", attemptId)
      .maybeSingle();

    if (attemptError || !attempt) {
      return res.status(404).json({
        success: false,
        message: "Data attempt peserta tidak ditemukan",
      });
    }

    // 2. Ambil seluruh daftar soal resmi kuis tersebut (agar soal yang tidak dijawab tetap muncul)
    const { data: allQuestions, error: questionsError } = await supabase
      .from("questions")
      .select(`
        id,
        question_text,
        question_type,
        short_answer,
        points,
        order_number,
        question_options (
          id,
          option_text,
          is_correct,
          order_number
        )
      `)
      .eq("quiz_id", attempt.quiz_id)
      .is("deleted_at", null)
      .order("order_number", { ascending: true });

    if (questionsError) {
      console.error("Error fetching questions:", questionsError);
      return res.status(500).json({
        success: false,
        message: "Gagal mengambil daftar soal kuis",
      });
    }

    // 3. Ambil jawaban tersimpan peserta untuk attemptId ini
    const { data: userAnswers, error: answersError } = await supabase
      .from("quiz_answers")
      .select("id, question_id, selected_option_id, text_answer, answered_at")
      .eq("attempt_id", attemptId);

    if (answersError) {
      console.error("Error fetching user answers:", answersError);
      return res.status(500).json({
        success: false,
        message: "Gagal mengambil data jawaban peserta",
      });
    }

    // Map jawaban peserta berdasarkan question_id agar lookup O(1)
    const answerMap = new Map();
    (userAnswers || []).forEach((ans) => {
      answerMap.set(ans.question_id, ans);
    });

    // 4. Gabungkan Soal + Jawaban Peserta & Urutkan secara Presisi
    const formattedAnswers = (allQuestions || []).map((q) => {
      // Urutkan pilihan ganda berdasarkan order_number
      if (q.question_options && Array.isArray(q.question_options)) {
        q.question_options.sort(
          (a, b) => (a.order_number || 0) - (b.order_number || 0)
        );
      }

      const existingAnswer = answerMap.get(q.id);

      return {
        id: existingAnswer?.id || `unanswered-${q.id}`,
        question_id: q.id,
        selected_option_id: existingAnswer?.selected_option_id || null,
        text_answer: existingAnswer?.text_answer || null,
        answered_at: existingAnswer?.answered_at || null,
        questions: q,
      };
    });

    // Urutkan seluruh array jawaban berdasarkan order_number soal
    formattedAnswers.sort(
      (a, b) => (a.questions?.order_number || 0) - (b.questions?.order_number || 0)
    );

    return res.json({
      success: true,
      attempt,
      answers: formattedAnswers,
    });
  } catch (error) {
    console.error("Review answers endpoint internal error:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data review jawaban peserta",
    });
  }
});

export default router;