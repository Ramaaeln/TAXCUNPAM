import { supabase } from "../lib/supabase.js";

const normalize = (value) => String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");

export function scoreAnswers(questions, answers) {
  const byQuestion = new Map(answers.map((answer) => [answer.question_id, answer]));
  let score = 0, correct = 0, wrong = 0;
  for (const question of questions) {
    const answer = byQuestion.get(question.id);
    if (!answer) continue;
    let isCorrect;
    if (question.question_type === "multiple_choice") {
      const option = question.question_options?.find((item) => item.id === answer.selected_option_id);
      if (!option) continue;
      isCorrect = option.is_correct;
    } else {
      if (!normalize(answer.text_answer)) continue;
      isCorrect = !!normalize(question.short_answer) && normalize(answer.text_answer) === normalize(question.short_answer);
    }
    if (isCorrect) { score += Number(question.points) || 0; correct++; }
    else wrong++;
  }
  return { score, total_questions: questions.length, correct_answers: correct, wrong_answers: wrong, unanswered: questions.length - correct - wrong };
}

export async function finalizeAttempt(attempt, status, extra = {}) {
  if (attempt.status !== "in_progress") return attempt;
  const [questionResult, answerResult] = await Promise.all([
    supabase.from("questions").select("id, points, question_type, short_answer, question_options(id, is_correct)").eq("quiz_id", attempt.quiz_id).is("deleted_at", null),
    supabase.from("quiz_answers").select("question_id, selected_option_id, text_answer").eq("attempt_id", attempt.id),
  ]);
  if (questionResult.error) throw questionResult.error;
  if (answerResult.error) throw answerResult.error;
  const update = {
    ...extra, ...scoreAnswers(questionResult.data || [], answerResult.data || []),
    status, auto_submitted: status !== "submitted", submitted_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from("quiz_attempts").update(update)
    .eq("id", attempt.id).eq("status", "in_progress").select().maybeSingle();
  if (error) throw error;
  if (data) return data;
  const current = await supabase.from("quiz_attempts").select("*").eq("id", attempt.id).single();
  if (current.error) throw current.error;
  return current.data;
}
