const fs = require('fs');
const path = require('path');
const assert = require('assert');

function runAlertRulesTests() {
  console.log('--- 🔔 Running Prometheus & Alertmanager Rule Tests ---');

  const alertRulesPath = path.join(__dirname, '../monitoring/prometheus/alert_rules.yml');
  const alertmanagerPath = path.join(__dirname, '../monitoring/alertmanager/alertmanager.yml');

  assert(fs.existsSync(alertRulesPath), 'monitoring/prometheus/alert_rules.yml must exist');
  assert(fs.existsSync(alertmanagerPath), 'monitoring/alertmanager/alertmanager.yml must exist');

  const alertContent = fs.readFileSync(alertRulesPath, 'utf8');
  assert(alertContent.includes('alert: PodCrashLoop'), 'Must contain PodCrashLoop alert rule');
  assert(alertContent.includes('alert: HighCPUUsage'), 'Must contain HighCPUUsage alert rule');
  assert(alertContent.includes('alert: NodeDown'), 'Must contain NodeDown alert rule');
  assert(alertContent.includes('alert: HighHttpErrorRate'), 'Must contain HighHttpErrorRate alert rule');
  console.log('  ✅ Alert rules defined: PodCrashLoop, HighCPUUsage, NodeDown, HighHttpErrorRate');

  const amContent = fs.readFileSync(alertmanagerPath, 'utf8');
  assert(amContent.includes('route:'), 'Alertmanager must define routing tree');
  assert(amContent.includes('receivers:'), 'Alertmanager must configure receivers');
  console.log('  ✅ Alertmanager routing and notification channels configured');

  console.log('  🎉 All Alert Rules Validation Tests Passed (2/2)\n');
}

module.exports = { runAlertRulesTests };
if (require.main === module) {
  runAlertRulesTests();
}
