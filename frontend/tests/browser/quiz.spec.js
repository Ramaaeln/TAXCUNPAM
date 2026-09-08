import { test, expect } from "@playwright/test";

async function setup(page, { skew = 86400000, failSubmit = false, remaining = 3600 } = {}) {
  const requests = [];
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(({ skew }) => {
    const OriginalDate = Date;
    window.Date = class extends OriginalDate {
      constructor(...args) { super(...(args.length ? args : [OriginalDate.now() + skew])); }
      static now() { return OriginalDate.now() + skew; }
    };
    Object.defineProperty(window, "outerHeight", { get: () => 2200 });
    Object.defineProperty(window, "BroadcastChannel", { value: undefined });
    Object.defineProperty(document, "fullscreenEnabled", { value: false });
  }, { skew });
  const now = Date.now();
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    requests.push({ path, body: route.request().postDataJSON() });
    let data = { success: true };
    let status = 200;
    if (path.endsWith("/token-login")) data = { success: true, accessToken: "test-token", quizId: "quiz-1", attemptId: "attempt-1" };
    else if (path.endsWith("/recover")) data = { success: true, status: "in_progress", answers: [] };
    else if (path.includes("/info/")) data = { success: true, quiz: { duration_minutes: 60, started_at: new Date(now - (3600 - remaining) * 1000).toISOString(), server_now: new Date().toISOString() } };
    else if (path.includes("/questions/")) data = { success: true, questions: [
      { id: "q1", question_type: "short_answer", question_text: "Jawaban pertama" },
      { id: "q2", question_type: "short_answer", question_text: "Jawaban kedua" },
    ] };
    else if (path.endsWith("/submit")) {
      status = failSubmit ? 503 : 200;
      data = failSubmit ? { success: false, message: "Server offline, coba lagi" } : { success: true, result: { status: "submitted" } };
    }
    await route.fulfill({ status, json: data });
  });
  await page.goto("/");
  await page.getByLabel("Token Akses Quiz").fill("UTCBT-TEST");
  await page.getByLabel("Nama Team / Peserta").fill("Regression Team");
  await page.getByRole("button", { name: "Masuk ke Ruang Kuis" }).click();
  await expect(page.getByRole("heading", { name: "Quiz Session" })).toBeVisible();
  return { requests, errors };
}

test("wrong device clock and large browser chrome do not auto-submit", async ({ page }) => {
  const { requests, errors } = await setup(page);
  await page.waitForTimeout(14000); // Exceeds the old geometry detector's startup period.
  await expect(page.getByRole("heading", { name: "Quiz Session" })).toBeVisible();
  expect(requests.filter(({ path }) => /\/(submit|violation)$/.test(path))).toHaveLength(0);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("final text answer is saved before explicit completion", async ({ page }) => {
  const { requests } = await setup(page, { skew: -86400000 });
  await page.getByRole("textbox").fill("Last answer");
  await page.getByRole("button", { name: "Akhiri Sesi Ujian" }).click();
  await page.getByRole("button", { name: "Ya, Akhiri Ujian" }).click();
  await expect(page.getByRole("heading", { name: "Ujian Selesai!" })).toBeVisible();
  const save = requests.findIndex(({ path, body }) => path.endsWith("/autosave") && body.textAnswer === "Last answer");
  const submit = requests.findIndex(({ path }) => path.endsWith("/submit"));
  expect(save).toBeGreaterThan(-1);
  expect(submit).toBeGreaterThan(save);
});

test("failed submit leaves answers and quiz available for retry", async ({ page }) => {
  await setup(page, { failSubmit: true });
  await page.getByRole("textbox").fill("Keep my answer");
  await page.getByRole("button", { name: "Akhiri Sesi Ujian" }).click();
  await page.getByRole("button", { name: "Ya, Akhiri Ujian" }).click();
  await expect(page.getByText("Server offline, coba lagi")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ujian Selesai!" })).toHaveCount(0);
  await expect(page.getByRole("textbox")).toHaveValue("Keep my answer");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("savedAnswers")).q1)).toBe("Keep my answer");
});

test("a truly expired server timer still completes", async ({ page }) => {
  const { requests } = await setup(page, { remaining: 0 });
  await expect(page.getByRole("heading", { name: "Ujian Selesai!" })).toBeVisible();
  expect(requests.filter(({ path }) => path.endsWith("/submit"))).toHaveLength(1);
});
