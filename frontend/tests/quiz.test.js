import test from "node:test";
import assert from "node:assert/strict";
import { createQuizClock, remainingSeconds } from "../src/utils/quizClock.js";
import { createAnswerQueue } from "../src/utils/answerQueue.js";

test("device dates and clock changes do not expire a fresh attempt", () => {
  const realNow = Date.now;
  try {
    for (const skew of [-86400000, 86400000, 365 * 86400000]) {
      Date.now = () => realNow() + skew;
      const clock = createQuizClock({ server_now: "2026-09-08T10:00:00Z", started_at: "2026-09-08T10:00:00Z", duration_minutes: 60 }, 100);
      assert.equal(remainingSeconds(clock, 1100), 3599);
    }
  } finally { Date.now = realNow; }
});

test("recovered and expired attempts use authoritative remaining time", () => {
  const clock = createQuizClock({ server_now: "2026-09-08T10:50:00Z", started_at: "2026-09-08T10:00:00Z", duration_minutes: 60 }, 0);
  assert.equal(remainingSeconds(clock, 0), 600);
  assert.equal(remainingSeconds(clock, 601000), 0);
  assert.throws(() => createQuizClock({ duration_minutes: 0 }));
  assert.throws(() => createQuizClock({ started_at: "bad", server_now: "bad", duration_minutes: 60 }));
});

test("pending answers survive question changes and flush in order", async () => {
  const writes = [];
  let release;
  const queue = createAnswerQueue(async (question, answer) => {
    writes.push([question.id, answer]);
    if (writes.length === 1) await new Promise((resolve) => { release = resolve; });
  });
  queue.enqueue({ id: "a" }, "old");
  const first = queue.flush();
  queue.enqueue({ id: "a" }, "new");
  queue.enqueue({ id: "b" }, "second question");
  const submissionFlush = queue.flush();
  release();
  await Promise.all([first, submissionFlush]);
  assert.deepEqual(writes, [["a", "old"], ["a", "new"], ["b", "second question"]]);
});

test("failed autosaves remain queued for retry before submission", async () => {
  let fail = true;
  const saved = [];
  const queue = createAnswerQueue(async (question, answer) => {
    if (fail) throw new Error("offline");
    saved.push(answer);
  });
  queue.enqueue({ id: "a" }, "answer");
  await assert.rejects(queue.flush(), /offline/);
  fail = false;
  await queue.flush();
  assert.deepEqual(saved, ["answer"]);
});
