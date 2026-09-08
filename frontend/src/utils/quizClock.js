// Anchor the countdown to server time and a monotonic clock, never the device date.
export function createQuizClock(quiz, now = performance.now()) {
  const serverNow = Date.parse(quiz.server_now);
  const startedAt = Date.parse(quiz.started_at);
  const durationMs = Number(quiz.duration_minutes) * 60_000;
  if (!Number.isFinite(serverNow) || !Number.isFinite(startedAt) ||
      !Number.isFinite(durationMs) || durationMs <= 0) {
    throw new Error("Waktu kuis tidak valid. Silakan muat ulang halaman.");
  }
  const remainingMs = Math.max(0, startedAt + durationMs - serverNow);
  return { remainingMs, receivedAt: now };
}

export function remainingSeconds(clock, now = performance.now()) {
  return Math.max(0, Math.ceil((clock.remainingMs - (now - clock.receivedAt)) / 1000));
}
