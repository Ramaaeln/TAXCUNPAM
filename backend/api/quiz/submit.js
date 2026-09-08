import express from "express";
import { verifyParticipant } from "../middleware/auth.js";
import { checkQuizTimer } from "../middleware/checkQuizTimer.js";
import { finalizeAttempt } from "../utils/finalizeAttempt.js";

const router = express.Router();
router.post("/", verifyParticipant, checkQuizTimer, async (req, res) => {
  try {
    const attempt = await finalizeAttempt(req.attempt, req.isTimeout ? "timeout" : "submitted");
    return res.json({ success: true, result: {
      score: attempt.score, totalQuestions: attempt.total_questions,
      correctAnswers: attempt.correct_answers, wrongAnswers: attempt.wrong_answers,
      unanswered: attempt.unanswered, status: attempt.status,
    } });
  } catch (error) {
    console.error("Submit failed:", error);
    return res.status(500).json({ success: false, message: "Failed to submit quiz. Please retry." });
  }
});
export default router;
