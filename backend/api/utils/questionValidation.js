export function validateQuestion(body = {}) {
  const { question_text, question_type, points = 10, options, correct_option, short_answer } = body;
  if (typeof question_text !== "string" || !question_text.trim() || question_text.length > 20000) return "Question text required";
  if (!["multiple_choice", "short_answer"].includes(question_type)) return "Invalid question type";
  if (!Number.isFinite(Number(points)) || Number(points) <= 0 || Number(points) > 100000) return "Invalid points";
  if (question_type === "multiple_choice") {
    if (!Array.isArray(options) || options.length < 2 || options.length > 20 || options.some((option) => typeof option !== "string" || !option.trim() || option.length > 10000)) return "At least two valid options required";
    if (!Number.isInteger(correct_option) || correct_option < 0 || correct_option >= options.length) return "Correct option required";
  } else if (typeof short_answer !== "string" || !short_answer.trim() || short_answer.length > 10000) return "Short answer required";
  return null;
}
