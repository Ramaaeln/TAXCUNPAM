/**
 * Test Suite: Quiz Operations (Questions, Info, Autosave, Submit)
 */

const API_URL = process.env.API_URL || "http://localhost:3000/api";

async function runQuizFlowTests() {
  console.log("==========================================");
  console.log("🧪 TESTING QUIZ OPERATIONS & WORKFLOW");
  console.log("==========================================");

  let passed = 0;
  let failed = 0;

  // Test 1: Unauthenticated Questions Request
  try {
    const res = await fetch(`${API_URL}/quiz/questions/dummy-quiz-id`);

    if (res.status === 401) {
      console.log("✅ [TEST 1 PASSED] Unauthenticated questions request correctly rejected (401)");
      passed++;
    } else {
      console.log(`❌ [TEST 1 FAILED] Expected status 401, got ${res.status}`);
      failed++;
    }
  } catch (err) {
    console.log(`❌ [TEST 1 FAILED] Request error: ${err.message}`);
    failed++;
  }

  // Test 2: Unauthenticated Quiz Info Request
  try {
    const res = await fetch(`${API_URL}/quiz/info/dummy-quiz-id`);

    if (res.status === 401) {
      console.log("✅ [TEST 2 PASSED] Unauthenticated quiz info request correctly rejected (401)");
      passed++;
    } else {
      console.log(`❌ [TEST 2 FAILED] Expected status 401, got ${res.status}`);
      failed++;
    }
  } catch (err) {
    console.log(`❌ [TEST 2 FAILED] Request error: ${err.message}`);
    failed++;
  }

  // Test 3: Unauthenticated Autosave Request
  try {
    const res = await fetch(`${API_URL}/quiz/autosave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: "q1", textAnswer: "Test" }),
    });

    if (res.status === 401) {
      console.log("✅ [TEST 3 PASSED] Unauthenticated autosave correctly rejected (401)");
      passed++;
    } else {
      console.log(`❌ [TEST 3 FAILED] Expected status 401, got ${res.status}`);
      failed++;
    }
  } catch (err) {
    console.log(`❌ [TEST 3 FAILED] Request error: ${err.message}`);
    failed++;
  }

  console.log(`\nSummary: ${passed} passed, ${failed} failed.\n`);
  return { passed, failed };
}

if (process.argv[1].endsWith("test-quiz-flow.js")) {
  runQuizFlowTests();
}

export default runQuizFlowTests;
