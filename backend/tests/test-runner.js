/**
 * Main Test Runner
 * Executes all test modules sequentially and provides a formatted report.
 */

import runLoginTests from "./test-login.js";
import runQuizFlowTests from "./test-quiz-flow.js";
import runViolationTests from "./test-violations.js";

async function runAllTests() {
  console.log("\n🚀 STARTING TAXCUNPAM AUTOMATED TEST SUITE\n");

  const start = Date.now();

  const loginResult = await runLoginTests();
  const quizFlowResult = await runQuizFlowTests();
  const violationResult = await runViolationTests();

  const totalPassed = loginResult.passed + quizFlowResult.passed + violationResult.passed;
  const totalFailed = loginResult.failed + quizFlowResult.failed + violationResult.failed;
  const elapsed = ((Date.now() - start) / 1000).toFixed(2);

  console.log("==========================================");
  console.log("📊 OVERALL TEST RESULTS");
  console.log("==========================================");
  console.log(`Total Passed : ${totalPassed}`);
  console.log(`Total Failed : ${totalFailed}`);
  console.log(`Time Elapsed : ${elapsed}s`);
  console.log("==========================================\n");

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllTests();
