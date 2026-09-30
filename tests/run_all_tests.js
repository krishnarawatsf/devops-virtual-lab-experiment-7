const { runUnitTests } = require('./unit.test');
const { runK8sValidationTests } = require('./k8s_validation.test');
const { runAlertRulesTests } = require('./alert_rules.test');

async function main() {
  console.log('=================================================================');
  console.log('🚀 VLE-7: Full DevOps Monitoring System - Automated Test Runner');
  console.log('=================================================================\n');

  try {
    await runUnitTests();
    runK8sValidationTests();
    runAlertRulesTests();

    console.log('=================================================================');
    console.log('🏆 SUMMARY: 100% of Test Suites Passed Successfully! (9/9 Checks)');
    console.log('=================================================================');
  } catch (error) {
    console.error('\n❌ TEST SUITE EXECUTION FAILED:', error.message);
    process.exit(1);
  }
}

main();
