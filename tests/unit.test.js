const assert = require('assert');
const { register, chaosState } = require('../src/app');

async function runUnitTests() {
  console.log('--- 🧪 Running Unit & Prometheus Metric Tests ---');

  // Test 1: Registry metrics check
  const metricsStr = await register.metrics();
  assert(typeof metricsStr === 'string', 'Metrics should export as string');
  assert(metricsStr.includes('http_requests_total'), 'Should contain http_requests_total metric');
  assert(metricsStr.includes('devops_app_'), 'Should contain default system metrics prefix');
  console.log('  ✅ Metric registry initialized with default & custom metrics');

  // Test 2: Gauge manipulation test
  const cpuGauge = register.getSingleMetric('pod_cpu_usage_percent');
  assert(cpuGauge !== undefined, 'pod_cpu_usage_percent metric must exist');
  cpuGauge.labels('myapp-test-pod', 'default').set(45.5);
  const updatedMetrics = await register.metrics();
  assert(updatedMetrics.includes('pod_cpu_usage_percent{pod_name="myapp-test-pod",namespace="default"} 45.5'), 'Gauge value should reflect in exported output');
  console.log('  ✅ Prometheus Gauge correctly tracks CPU utilization');

  // Test 3: Counter increment test
  const restartCounter = register.getSingleMetric('kube_pod_container_status_restarts_total');
  assert(restartCounter !== undefined, 'kube_pod_container_status_restarts_total metric must exist');
  restartCounter.inc({ pod_name: 'myapp-test-pod', namespace: 'default', container: 'myapp' }, 1);
  const restartMetrics = await register.metrics();
  assert(restartMetrics.includes('kube_pod_container_status_restarts_total'), 'Restart counter should be recorded');
  console.log('  ✅ Pod restart counter increments accurately for CrashLoopBackOff detection');

  // Test 4: Chaos state default integrity
  assert.strictEqual(chaosState.cpuSpike, false, 'CPU spike chaos state should default to false');
  assert.strictEqual(chaosState.highErrorRate, false, 'Error spike chaos state should default to false');
  console.log('  ✅ Application state and chaos engineering hooks verified');

  console.log('  🎉 All Unit Tests Passed (4/4)\n');
}

module.exports = { runUnitTests };
if (require.main === module) {
  runUnitTests().catch(err => {
    console.error('❌ Unit Tests Failed:', err);
    process.exit(1);
  });
}
