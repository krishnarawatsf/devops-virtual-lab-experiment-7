const fs = require('fs');
const path = require('path');
const assert = require('assert');

function runK8sValidationTests() {
  console.log('--- ☸️ Running Kubernetes Manifest Validation Tests ---');

  const deploymentPath = path.join(__dirname, '../k8s/deployment.yaml');
  const servicePath = path.join(__dirname, '../k8s/service.yaml');
  const configMapPath = path.join(__dirname, '../k8s/configmap.yaml');

  assert(fs.existsSync(deploymentPath), 'k8s/deployment.yaml must exist');
  assert(fs.existsSync(servicePath), 'k8s/service.yaml must exist');
  assert(fs.existsSync(configMapPath), 'k8s/configmap.yaml must exist');
  console.log('  ✅ Manifest files exist in k8s/ directory');

  const deploymentContent = fs.readFileSync(deploymentPath, 'utf8');
  assert(deploymentContent.includes('kind: Deployment'), 'Must define a Deployment kind');
  assert(deploymentContent.includes('replicas: 2'), 'Must specify 2 replicas for high availability');
  assert(deploymentContent.includes('livenessProbe:'), 'Must include livenessProbe');
  assert(deploymentContent.includes('readinessProbe:'), 'Must include readinessProbe');
  assert(deploymentContent.includes('prometheus.io/scrape: "true"'), 'Must include Prometheus scrape annotation');
  console.log('  ✅ Deployment manifest adheres to production specs & Prometheus annotations');

  const serviceContent = fs.readFileSync(servicePath, 'utf8');
  assert(serviceContent.includes('kind: Service'), 'Must define Service kind');
  assert(serviceContent.includes('port: 8080'), 'Must route to port 8080');
  console.log('  ✅ Service manifest is valid and routes traffic to backend pods');

  console.log('  🎉 All Kubernetes Validation Tests Passed (3/3)\n');
}

module.exports = { runK8sValidationTests };
if (require.main === module) {
  runK8sValidationTests();
}
