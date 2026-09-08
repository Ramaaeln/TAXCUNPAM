import { test, expect } from "@playwright/test";

test("admin routes render without errors and fit the viewport", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem("adminToken", "test-admin"));
  await page.route("**/api/**", (route) => route.fulfill({ json: {
    success: true, quizzes: [{ id: "quiz", title: "Test Quiz", duration_minutes: 60 }],
    participants: [], questions: [], leaderboard: [], answers: [],
    totalQuiz: 1, participantsCount: 0, submissions: 0, activeQuiz: 0,
    attempt: { participant_name: "Test", quizzes: { title: "Test Quiz" } },
  } }));
  for (const route of ["create-quiz", "questions", "tokens", "recovery", "live-monitor", "leaderboard", "participants", "review-answers/attempt"]) {
    await page.goto(`/utcbt-internal/${route}`);
    await expect(page.getByRole("button", { name: /Dashboard|Kembali/ }).first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
  }
  expect(errors).toEqual([]);
});

test("spreadsheet export produces an xlsx file", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("adminToken", "test-admin"));
  await page.route("**/api/**", (route) => route.fulfill({ json: {
    success: true, participants: [{ id: "attempt", participant_name: "Test Participant", status: "submitted", score: 10, quizzes: { title: "Test Quiz" } }],
  } }));
  await page.goto("/utcbt-internal/participants");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /Excel/i }).click();
  expect((await download).suggestedFilename()).toBe("participants.xlsx");
});
