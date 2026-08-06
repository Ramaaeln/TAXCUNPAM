import express from "express";
import { supabase } from "../lib/supabase.js";
import { verifyParticipant } from "../middleware/auth.js";
import { checkQuizTimer } from "../middleware/checkQuizTimer.js";

const router = express.Router();

router.post("/", verifyParticipant, checkQuizTimer, async (req, res) => {
  try {
    const attemptId = req.user?.attemptId;
    const { reason } = req.body;

    if (!attemptId) {
      return res.status(401).json({
        success: false,
        message: "Invalid participant token",
      });
    }

    const { data: attempt, error: attemptError } = await supabase
      .from("quiz_attempts")
      .select("*")
      .eq("id", attemptId)
      .single();

    if (attemptError || !attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found",
      });
    }

    // Jika kuis sudah ditandai selesai sebelumnya, kembalikan data yang ada tanpa hitung ulang
    if (
      ["submitted", "timeout", "disqualified", "auto_submitted"].includes(
        attempt.status
      )
    ) {
      return res.json({
        success: true,
        message: "Quiz already finished",
        result: {
          score: attempt.score,
          totalQuestions: attempt.total_questions,
          correctAnswers: attempt.correct_answers,
          wrongAnswers: attempt.wrong_answers,
          unanswered: attempt.unanswered,
          status: attempt.status,
        },
      });
    }

    // Fetch jawaban peserta + relasi ke kunci jawaban
    const { data: answers, error: answersError } = await supabase
      .from("quiz_answers")
      .select(
        `
        id,
        question_id,
        selected_option_id,
        text_answer,
        questions (
          id,
          points,
          question_type,
          short_answer
        ),
        question_options!quiz_answers_selected_option_id_fkey (
          id,
          is_correct
        )
      `
      )
      .eq("attempt_id", attemptId);

    if (answersError) {
      console.error("Fetch answers error:", answersError);
      return res.status(500).json({
        success: false,
        message: "Failed fetch answers",
      });
    }

    const safeAnswers = answers || [];
    let score = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let trulyAnsweredCount = 0;

    for (const answer of safeAnswers) {
      const questionType = answer?.questions?.question_type;

      if (questionType === "multiple_choice") {
        if (answer?.selected_option_id) {
          trulyAnsweredCount++;
          const isCorrect = answer?.question_options?.is_correct;

          if (isCorrect) {
            score += answer?.questions?.points || 0;
            correctAnswers++;
          } else {
            wrongAnswers++;
          }
        }
      } else {
        const rawUserAnswer = answer?.text_answer?.trim();

        if (rawUserAnswer && rawUserAnswer !== "") {
          trulyAnsweredCount++;

          const userAnswer = rawUserAnswer.toLowerCase().replace(/\s+/g, " ");
          const correctAnswer = answer?.questions?.short_answer
            ?.trim()
            ?.toLowerCase()
            ?.replace(/\s+/g, " ");

          if (correctAnswer && userAnswer === correctAnswer) {
            score += answer?.questions?.points || 0;
            correctAnswers++;
          } else {
            wrongAnswers++;
          }
        }
      }
    }

    // Hitung total soal
    const { count: totalQuestions, error: totalError } = await supabase
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("quiz_id", attempt.quiz_id)
      .is("deleted_at", null);

    if (totalError) {
      console.error("Count total questions error:", totalError);
      return res.status(500).json({
        success: false,
        message: "Failed count questions",
      });
    }

    const total = totalQuestions || 0;
    const unanswered = Math.max(0, total - trulyAnsweredCount);

    // Tentukan status akhir
    let finalStatus = "submitted";
    let isAutoSubmitted = false;

    if (reason === "cheated") {
      finalStatus = "auto_submitted";
      isAutoSubmitted = true;
    } else if (req.isTimeout) {
      finalStatus = "timeout";
    }

    // Update data hasil pengerjaan di quiz_attempts
    const { error: updateError } = await supabase
      .from("quiz_attempts")
      .update({
        score,
        total_questions: total,
        correct_answers: correctAnswers,
        wrong_answers: wrongAnswers,
        unanswered,
        status: finalStatus,
        auto_submitted: isAutoSubmitted,
        submitted_at: new Date().toISOString(),
      })
      .eq("id", attemptId);

    if (updateError) {
      console.error("Update quiz attempt error:", updateError);
      return res.status(500).json({
        success: false,
        message: "Failed update result",
      });
    }

    // CATATAN: Poin penting - Sesi TIDAK di-set is_active = false secara instan di sini
    // agar token JWT masih bisa dipakai untuk memanggil GET /quiz/result.
    // Penutupan penuh sesi diikutsertakan saat user klik tombol "Keluar" di halaman hasil.

    return res.json({
      success: true,
      result: {
        score,
        totalQuestions: total,
        correctAnswers,
        wrongAnswers,
        unanswered,
        status: finalStatus,
      },
    });
  } catch (error) {
    console.error("Submit internal error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;