const express = require('express');
const client = require('prom-client');

// Initialize Prometheus registry
const register = new client.Registry();

// Enable default OS and NodeJS runtime metrics
client.collectDefaultMetrics({
  register,
  prefix: 'devops_app_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
});

// Custom Prometheus Metrics
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests received',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register]
});

const activeSessionsGauge = new client.Gauge({
  name: 'app_active_sessions',
  help: 'Number of active user sessions in the application',
  registers: [register]
});

const podCpuUsageGauge = new client.Gauge({
  name: 'pod_cpu_usage_percent',
  help: 'Simulated CPU usage percentage for the pod',
  labelNames: ['pod_name', 'namespace'],
  registers: [register]
});

const podMemoryUsageGauge = new client.Gauge({
  name: 'pod_memory_usage_megabytes',
  help: 'Simulated Memory usage in MB for the pod',
  labelNames: ['pod_name', 'namespace'],
  registers: [register]
});

const podRestartsCounter = new client.Counter({
  name: 'kube_pod_container_status_restarts_total',
  help: 'Total number of container restarts in Kubernetes',
  labelNames: ['pod_name', 'namespace', 'container'],
  registers: [register]
});

// Set baseline initial values
activeSessionsGauge.set(42);
podCpuUsageGauge.labels('myapp-7c6d489b4f-8m2qx', 'production').set(24.5);
podMemoryUsageGauge.labels('myapp-7c6d489b4f-8m2qx', 'production').set(185.2);

const app = express();
app.use(express.json());

// State for chaos testing simulations
const chaosState = {
  cpuSpike: false,
  highErrorRate: false,
  crashLoopCount: 0,
  latencyDelayMs: 0
};

// Middleware to measure request latency & count
app.use((req, res, next) => {
  const start = process.hrtime();
  
  res.on('finish', () => {
    const elapsed = process.hrtime(start);
    const durationInSeconds = elapsed[0] + elapsed[1] / 1e9;
    
    // Normalize path for labels
    const route = req.route ? req.route.path : req.path;
    const statusCode = res.statusCode.toString();

    httpRequestsTotal.inc({ method: req.method, route, status_code: statusCode });
    httpRequestDuration.observe({ method: req.method, route, status_code: statusCode }, durationInSeconds);
  });

  if (chaosState.latencyDelayMs > 0) {
    setTimeout(next, chaosState.latencyDelayMs);
  } else {
    next();
  }
});

// --- Application REST Endpoints ---

app.get('/api/status', (req, res) => {
  res.json({
    status: 'healthy',
    environment: 'production',
    cluster: 'aws-eks-production-cluster-01',
    version: 'v1.4.2',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    chaosState
  });
});

app.get('/api/orders', (req, res) => {
  if (chaosState.highErrorRate && Math.random() < 0.7) {
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Simulated database deadlock under heavy stress (Chaos Injection active)'
    });
  }

  res.json({
    orders: [
      { id: 'ORD-9021', item: 'AWS Cloud EC2 Provisioning Package', amount: 249.99, status: 'COMPLETED' },
      { id: 'ORD-9022', item: 'Kubernetes Cluster Monitoring Suite', amount: 499.00, status: 'PROCESSING' },
      { id: 'ORD-9023', item: 'Prometheus & Grafana Enterprise Add-on', amount: 129.50, status: 'COMPLETED' }
    ],
    count: 3
  });
});

app.post('/api/orders', (req, res) => {
  const { item, amount } = req.body || {};
  res.status(201).json({
    message: 'Order created successfully',
    orderId: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
    item: item || 'DevOps Continuous Monitoring Service',
    amount: amount || 99.00,
    created_at: new Date().toISOString()
  });
});

// Kubernetes Health Probes
app.get('/api/health/live', (req, res) => {
  if (chaosState.crashLoopCount > 3) {
    return res.status(503).json({ status: 'unhealthy', reason: 'CrashLoopBackOff simulation triggered' });
  }
  res.status(200).json({ status: 'alive', check: 'livenessProbe', timestamp: Date.now() });
});

app.get('/api/health/ready', (req, res) => {
  res.status(200).json({ status: 'ready', check: 'readinessProbe', traffic: 'accepted' });
});

// Standard Prometheus Metrics Exporter Endpoint
app.get('/metrics', async (req, res) => {
  try {
    // Dynamically update gauges with simulated realism
    if (chaosState.cpuSpike) {
      podCpuUsageGauge.labels('myapp-7c6d489b4f-8m2qx', 'production').set(92.4 + Math.random() * 5);
    } else {
      podCpuUsageGauge.labels('myapp-7c6d489b4f-8m2qx', 'production').set(22.0 + Math.random() * 6);
    }

    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

// Chaos Testing Endpoints (Alert Triggers)
app.post('/api/chaos/cpu-spike', (req, res) => {
  chaosState.cpuSpike = true;
  podCpuUsageGauge.labels('myapp-7c6d489b4f-8m2qx', 'production').set(94.8);
  res.json({ message: 'CPU Spike simulated at 94.8%. HighCPUUsage alert threshold exceeded (>85%).', chaosState });
});

app.post('/api/chaos/error-spike', (req, res) => {
  chaosState.highErrorRate = true;
  chaosState.latencyDelayMs = 250;
  res.json({ message: 'Error rate spiked to 70% 500s. HighHttpErrorRate alert triggered.', chaosState });
});

app.post('/api/chaos/pod-crash', (req, res) => {
  chaosState.crashLoopCount += 1;
  podRestartsCounter.inc({ pod_name: 'myapp-7c6d489b4f-8m2qx', namespace: 'production', container: 'myapp' }, 1);
  res.json({ message: `Pod restart count increased to ${chaosState.crashLoopCount}. PodCrashLoop rule active when >3 restarts.`, chaosState });
});

app.post('/api/chaos/reset', (req, res) => {
  chaosState.cpuSpike = false;
  chaosState.highErrorRate = false;
  chaosState.crashLoopCount = 0;
  chaosState.latencyDelayMs = 0;
  podCpuUsageGauge.labels('myapp-7c6d489b4f-8m2qx', 'production').set(25.0);
  res.json({ message: 'All chaos triggers cleared. System metrics back to normal nominal values.', chaosState });
});

module.exports = { app, register, chaosState };
