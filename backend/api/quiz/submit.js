import express from "express";
import { supabase } from "../lib/supabase.js";
import { verifyParticipant } from "../middleware/auth.js";
import { checkQuizTimer } from "../middleware/checkQuizTimer.js";

const router = express.Router();

router.post("/", verifyParticipant, checkQuizTimer, async (req, res) => {
  try {
    const attemptId = req.user.attemptId;

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

    if (["submitted", "timeout", "disqualified", "auto_submitted"].includes(attempt.status)) {
      return res.json({
        success: true,
        message: "Quiz already finished",
      });
    }

    const { data: answers, error: answersError } = await supabase
      .from("quiz_answers")
      .select(`
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
      `)
      .eq("attempt_id", attemptId);

    if (answersError) {
      console.error(answersError);
      return res.status(500).json({
        success: false,
        message: "Failed fetch answers",
      });
    }

    const safeAnswers = answers || [];
    let score = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;

    for (const answer of safeAnswers) {
      const questionType = answer?.questions?.question_type;

      if (questionType === "multiple_choice") {
        const isCorrect = answer?.question_options?.is_correct;

        if (isCorrect) {
          score += answer?.questions?.points || 0;
          correctAnswers++;
        } else {
          wrongAnswers++;
        }
      } else {
        const userAnswer = answer?.text_answer?.trim()?.toLowerCase()?.replace(/\s+/g, " ");
        const correctAnswer = answer?.questions?.short_answer?.trim()?.toLowerCase()?.replace(/\s+/g, " ");

        if (userAnswer && correctAnswer && userAnswer === correctAnswer) {
          score += answer?.questions?.points || 0;
          correctAnswers++;
        } else {
          wrongAnswers++;
        }
      }
    }

    const { count: totalQuestions, error: totalError } = await supabase
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("quiz_id", attempt.quiz_id)
      .is("deleted_at", null);

    if (totalError) {
      console.error(totalError);
      return res.status(500).json({
        success: false,
        message: "Failed count questions",
      });
    }

    const unanswered = totalQuestions - safeAnswers.length;

    const { error: updateError } = await supabase
      .from("quiz_attempts")
      .update({
        score,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        wrong_answers: wrongAnswers,
        unanswered,
        submitted_at: new Date(),
        status: "submitted",
      })
      .eq("id", attemptId);

    if (updateError) {
      console.error(updateError);
      return res.status(500).json({
        success: false,
        message: "Failed update result",
      });
    }

    return res.json({
      success: true,
      result: {
        score,
        totalQuestions,
        correctAnswers,
        wrongAnswers,
        unanswered,
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;