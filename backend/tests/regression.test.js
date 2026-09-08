import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

// Never use project credentials or connect to the real database in this suite.
process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "local-test-placeholder";
process.env.JWT_SECRET = "local-regression-secret-not-for-production";
process.env.CLIENT_URL = "https://quiz.example.com";
process.env.NODE_ENV = "test";
const { supabase } = await import("../api/lib/supabase.js");
const { default: app } = await import("../api/index.js");
const { scoreAnswers } = await import("../api/utils/finalizeAttempt.js");
let db, server, base, writes, failTable;

supabase.from = (table) => {
  let operation = "select", payload, single = false;
  const filters = [];
  const query = {
    select() { return query; },
    eq(key, value) { filters.push((row) => row[key] === value); return query; },
    is(key, value) { filters.push((row) => (row[key] ?? null) === value); return query; },
    in(key, values) { filters.push((row) => values.includes(row[key])); return query; },
    order() { return query; },
    update(value) { operation = "update"; payload = value; return query; },
    insert(value) { operation = "insert"; payload = value; return query; },
    upsert(value) { operation = "upsert"; payload = value; return query; },
    single() { single = true; return query; },
    maybeSingle() { single = true; return query; },
    then(resolve, reject) {
      if (failTable === table) return Promise.resolve({ data: null, error: { message: "Simulated database failure" } }).then(resolve, reject);
      let rows = (db[table] || []).filter((row) => filters.every((filter) => filter(row)));
      if (operation !== "select") {
        writes.push({ table, operation, payload });
        if (operation === "update") rows.forEach((row) => Object.assign(row, payload));
        else if (operation === "upsert") {
          const row = db[table].find((item) => item.attempt_id === payload.attempt_id && item.question_id === payload.question_id);
          if (row) Object.assign(row, payload); else db[table].push(payload);
          rows = [payload];
        } else { rows = Array.isArray(payload) ? payload : [payload]; db[table] = [...(db[table] || []), ...rows]; }
      }
      return Promise.resolve({ data: structuredClone(single ? rows[0] || null : rows), error: null }).then(resolve, reject);
    },
  };
  return query;
};

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((resolve) => server.close(resolve)));
beforeEach(() => {
  writes = []; failTable = null;
  db = {
    participant_sessions: [{ id: "session", attempt_id: "attempt", is_active: true }],
    quiz_attempts: [{ id: "attempt", quiz_id: "quiz", status: "in_progress", started_at: new Date().toISOString(), quizzes: { duration_minutes: 60 } }],
    quizzes: [{ id: "quiz", title: "Quiz", duration_minutes: 60 }],
    questions: [
      { id: "q1", quiz_id: "quiz", question_type: "multiple_choice", points: 10, question_options: [{ id: "o1", is_correct: true }] },
      { id: "q2", quiz_id: "quiz", question_type: "short_answer", points: 5, short_answer: "Tax Center" },
      { id: "foreign", quiz_id: "other", question_type: "short_answer", points: 100 },
    ],
    question_options: [{ id: "o1", question_id: "q1", is_correct: true }, { id: "foreign-option", question_id: "foreign", is_correct: true }],
    quiz_answers: [], quiz_settings: [{ quiz_id: "quiz", max_tab_switch: 1 }], violation_logs: [],
  };
});

function accessToken(claims = {}) {
  return jwt.sign({ role: "participant", attemptId: "attempt", sessionId: "session", quizId: "quiz", ...claims }, process.env.JWT_SECRET);
}
async function request(path, body, token = accessToken(), extraHeaders = {}) {
  const response = await fetch(base + path, { method: body === undefined ? "GET" : "POST", headers: {
    Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...extraHeaders,
  }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, data: await response.json(), headers: response.headers };
}

test("quiz info includes valid server time and session start", async () => {
  const response = await request("/api/quiz/info/quiz");
  assert.equal(response.status, 200);
  assert.ok(Math.abs(Date.parse(response.data.quiz.server_now) - Date.now()) < 5000);
  assert.equal(response.headers.get("cache-control"), "no-store");
});
test("participant routes reject admin tokens, missing sessions, and mismatched sessions", async () => {
  for (const claims of [{ role: "admin" }, { sessionId: null }, { attemptId: "other" }]) {
    assert.equal((await request("/api/quiz/recover", undefined, accessToken(claims))).status, 401);
  }
});
test("database session outage is retryable and not treated as logout", async () => {
  failTable = "participant_sessions";
  assert.equal((await request("/api/quiz/recover")).status, 503);
});
test("autosave rejects foreign questions and options without writing", async () => {
  assert.equal((await request("/api/quiz/autosave", { questionId: "foreign", textAnswer: "answer" })).status, 400);
  assert.equal((await request("/api/quiz/autosave", { questionId: "q1", selectedOptionId: "foreign-option" })).status, 400);
  assert.equal(writes.length, 0);
});
test("submit scores stored answers and repeat requests preserve the result", async () => {
  await request("/api/quiz/autosave", { questionId: "q1", selectedOptionId: "o1" });
  await request("/api/quiz/autosave", { questionId: "q2", textAnswer: " tax   CENTER " });
  const first = await request("/api/quiz/submit", {});
  const second = await request("/api/quiz/submit", {});
  assert.equal(first.data.result.score, 15);
  assert.deepEqual(first.data.result, second.data.result);
  assert.equal(writes.filter((write) => write.table === "quiz_attempts").length, 1);
});
test("invalid timer fails safely without finishing the attempt", async () => {
  db.quiz_attempts[0].quizzes.duration_minutes = null;
  assert.equal((await request("/api/quiz/autosave", { questionId: "q2", textAnswer: "answer" })).status, 503);
  assert.equal(db.quiz_attempts[0].status, "in_progress");
});
test("submission during save grace period is still recorded as timeout", async () => {
  db.quiz_attempts[0].started_at = new Date(Date.now() - 3601000).toISOString();
  const response = await request("/api/quiz/submit", {});
  assert.equal(response.data.result.status, "timeout");
});
test("timeout and violations calculate scores before marking complete", async () => {
  db.quiz_answers.push({ attempt_id: "attempt", question_id: "q1", selected_option_id: "o1" });
  db.quiz_attempts[0].started_at = new Date(Date.now() - 3700000).toISOString();
  const timeout = await request("/api/quiz/autosave", { questionId: "q2", textAnswer: "late" });
  assert.equal(timeout.data.code, "QUIZ_EXPIRED");
  assert.equal(db.quiz_attempts[0].status, "timeout");
  assert.equal(db.quiz_attempts[0].score, 10);
  db.quiz_attempts[0].status = "in_progress";
  const violation = await request("/api/quiz/violation", { violationType: "tab_switch" });
  assert.equal(violation.data.disqualified, true);
  assert.equal(db.quiz_attempts[0].score, 10);
});
test("geometry/focus reports from cached clients do not disqualify", async () => {
  for (const violationType of ["devtools", "blur"]) {
    const response = await request("/api/quiz/violation", { violationType });
    assert.equal(response.data.autoSubmitted, false);
  }
  assert.equal(writes.length, 0);
});
test("disabled tab-switch policy is respected", async () => {
  db.quiz_settings[0].auto_submit_on_tab_switch = false;
  const response = await request("/api/quiz/violation", { violationType: "tab_switch" });
  assert.equal(response.data.autoSubmitted, false);
  assert.equal(db.quiz_attempts[0].status, "in_progress");
});
test("scoring ignores answers and options belonging to another question/quiz", () => {
  const score = scoreAnswers(db.questions.filter((q) => q.quiz_id === "quiz"), [
    { question_id: "q1", selected_option_id: "foreign-option" }, { question_id: "foreign", text_answer: "x" },
  ]);
  assert.equal(score.score, 0);
  assert.equal(score.unanswered, 2);
});
test("CORS rejects deceptive origin prefixes and database debug route is absent", async () => {
  assert.equal((await request("/", undefined, undefined, { Origin: "https://quiz.example.com.attacker.test" })).status, 403);
  assert.equal((await request("/", undefined, undefined, { Origin: "https://quiz.example.com" })).status, 200);
  assert.equal((await request("/test-db")).status, 404);
});
test("malformed login input returns validation error", async () => {
  assert.equal((await request("/api/auth/token-login", { token: 123, participantName: {} })).status, 400);
  assert.equal((await request("/api/admin/login", { email: {}, password: [] })).status, 400);
});
