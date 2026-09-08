/**
 * Test Suite: Anti-Cheat Violation Endpoint
 */

const API_URL = process.env.API_URL || "http://localhost:3000/api";

async function runViolationTests() {
  console.log("==========================================");
  console.log("🧪 TESTING ANTI-CHEAT VIOLATION HANDLING");
  console.log("==========================================");

  let passed = 0;
  let failed = 0;

  // Test 1: Unauthenticated Violation Request
  try {
    const res = await fetch(`${API_URL}/quiz/violation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ violationType: "tab_switch" }),
    });

    if (res.status === 401) {
      console.log("✅ [TEST 1 PASSED] Unauthenticated violation report correctly rejected (401)");
      passed++;
    } else {
      console.log(`❌ [TEST 1 FAILED] Expected status 401, got ${res.status}`);
      failed++;
    }
  } catch (err) {
    console.log(`❌ [TEST 1 FAILED] Request error: ${err.message}`);
    failed++;
  }

  console.log(`\nSummary: ${passed} passed, ${failed} failed.\n`);
  return { passed, failed };
}

if (process.argv[1].endsWith("test-violations.js")) {
  runViolationTests();
}

export default runViolationTests;
