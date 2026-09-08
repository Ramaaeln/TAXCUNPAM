/**
 * Test Suite: Token Login & Validation
 */

const API_URL = process.env.API_URL || "http://localhost:3000/api";

async function runLoginTests() {
  console.log("==========================================");
  console.log("🧪 TESTING TOKEN LOGIN & VALIDATION");
  console.log("==========================================");

  let passed = 0;
  let failed = 0;

  // Test 1: Empty Token or Participant Name
  try {
    const res = await fetch(`${API_URL}/auth/token-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "", participantName: "" }),
    });

    if (res.status === 400) {
      console.log("✅ [TEST 1 PASSED] Missing token/name correctly rejected (400)");
      passed++;
    } else {
      console.log(`❌ [TEST 1 FAILED] Expected status 400, got ${res.status}`);
      failed++;
    }
  } catch (err) {
    console.log(`❌ [TEST 1 FAILED] Request error: ${err.message}`);
    failed++;
  }

  // Test 2: Invalid Non-Existent Token
  try {
    const res = await fetch(`${API_URL}/auth/token-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "UTCBT-INVALID999", participantName: "Test Team" }),
    });

    if (res.status === 401) {
      console.log("✅ [TEST 2 PASSED] Invalid token correctly rejected (401)");
      passed++;
    } else {
      console.log(`❌ [TEST 2 FAILED] Expected status 401, got ${res.status}`);
      failed++;
    }
  } catch (err) {
    console.log(`❌ [TEST 2 FAILED] Request error: ${err.message}`);
    failed++;
  }

  console.log(`\nSummary: ${passed} passed, ${failed} failed.\n`);
  return { passed, failed };
}

if (process.argv[1].endsWith("test-login.js")) {
  runLoginTests();
}

export default runLoginTests;
