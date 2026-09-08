# Workspace production review

Reviewed 2026-09-08. Changes are local; no deployment or production database writes were performed.

## Reported immediate completion

The original countdown subtracted the server's `started_at` from the device's `Date.now()`. A device clock ahead by the quiz duration could therefore call submit one second after login and display **Ujian Selesai!**. This reproduces the reported symptom, although the affected device's clock/logs were not available to confirm its exact cause.

The API now returns `server_now`. The frontend anchors remaining time to that value and `performance.now()`, with periodic and resume-time synchronization. Invalid timer data displays a retryable error instead of ending the attempt. See [MDN's timing documentation](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now) for why wall-clock changes affect `Date.now()` and not the monotonic timer.

## Other corrections

- Pending answers are queued across questions, serialized, retried after connection errors, and flushed before submission. Only unsaved local answers override server recovery data.
- Failed submission retains the quiz and answers. Completion requires a successful server response.
- Normal, expired, and disqualified attempts share server-side scoring. Conditional completion updates prevent a later submit from overwriting an already finished result.
- Window geometry no longer triggers DevTools disqualification. The backend also ignores geometry/focus reports from cached clients. Fullscreen and BroadcastChannel support are checked before use; duplicate tabs display a warning. Configured tab-switch/fullscreen policies remain enforced, with brief visibility changes tolerated.
- Participant sessions require the correct role and matching session/attempt. Database verification failures are retryable rather than forced logout.
- Answer saving validates quiz/question/option ownership. Scoring only considers the quiz's current undeleted questions and their own options.
- Removed the public `/test-db` endpoint; CORS uses exact origins; authenticated traffic is rate-limited per verified identity rather than all participants sharing one network address. Successful logins do not exhaust the failed-login limit.
- Fixed the quiz creation render loop, participant loading typo, unstable effects, input validation, unchecked question-write errors, and clipboard error handling.
- Login no longer clears admin credentials. Mobile input sizes, wrapping, page language and fallback theme colors were corrected.
- Pages and spreadsheet exports load on demand. Replaced `xlsx` with the existing ExcelJS dependency; patched vulnerable dependencies. ExcelJS remains a large optional download used for export.

## Validation

Final local results: **47 tests passed** (13 backend, 4 frontend unit, 30 browser), frontend lint passed, production build passed, backend JavaScript syntax checks passed, and `git diff --check` passed. Browser coverage included desktop Chromium and Firefox, Android/Chromium, and iPhone/iPad WebKit profiles. The build's remaining size warning concerns the optional ExcelJS export chunk, which is loaded only when requested.

Use the committed tests to reproduce results:

```text
cd backend
npm ci
npm test

cd ../frontend
npm ci
npm run lint
npm test
npm run build
npx playwright install chromium firefox webkit
npm run test:e2e
```

Backend tests replace the database client with fixtures and never connect to Supabase. Browser tests mock API responses and exercise real browser engines with desktop, phone and tablet viewports. They are not physical-device certification or a live database integration test. Dependency audits reported zero known vulnerabilities in both projects after updates.

## Release checks still required

This workspace alone is **not sufficient to certify production readiness**:

1. **Database atomicity and constraints:** the repository has no schema/migrations. Token claiming/session replacement, question/option editing, and autosave versus finalization use multiple database requests. Database transactions or RPCs and concurrency tests are still needed to guarantee correctness across simultaneous requests/serverless instances. Verify a unique `(attempt_id, question_id)` constraint for autosave, token hashes, and the intended active-attempt/session uniqueness rules against existing data. Do not modify questions/options after participants start until edits are transactional and quiz content is frozen/versioned.
2. **Database access and operations:** verify Supabase RLS/grants protect participant data and answer keys from anon/authenticated direct access, service keys stay server-only, and backups/restoration and monitoring work. None of those deployed settings were available in the workspace.
3. **Quiz availability rules:** token login currently uses token expiry and attempt duration; it does not enforce quiz `is_active`, `start_time` or `end_time`. Confirm whether organizer-issued tokens are the intended admission control before using scheduled opening/closing times.
4. **Deployment integration and load:** test a real staging token, recovery, scoring, and admin exports with a disposable database. Verify proxy configuration and rate limits at expected attendance; the in-memory limiter is not shared across serverless instances.
5. **Physical devices:** repeat login and submission on the affected device, Safari/iOS and Android, including keyboard opening, orientation changes, sleep/resume and unstable networks. Browser emulation cannot reproduce every OS interruption.

## Deployment configuration

- Backend: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `CLIENT_URL` (exact frontend origin, no path), `NODE_ENV=production`, optional `PORT` for local hosting.
- Frontend: `VITE_BASE_URL=https://your-api-host/api` for separate deployments. Without it, requests use `/api`; local Vite proxies that path to port 3000. The supplied frontend Vercel configuration serves the SPA and does not proxy a separate backend.
- Deploy the backend before the frontend because the new countdown requires `server_now`. Reload existing browser tabs so cached code is replaced.
- An attempt already completed by the previous bug remains completed. An organizer should review it and use the existing session recovery screen with an explicit remaining duration if reopening is appropriate. This review did not reset participant attempts or scores.
