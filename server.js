const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');
const { app, register, chaosState } = require('./src/app');

const PORT = process.env.PORT || 8080;

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// Alerts database for Alertmanager simulation & webhooks
let activeAlerts = [];
let recentAlertHistory = [];

// Alertmanager Webhook receiver endpoint
app.post('/api/alerts/webhook', (req, res) => {
  const alertData = req.body;
  const newAlert = {
    id: `ALT-${Date.now().toString().slice(-4)}`,
    name: alertData.alertname || 'CustomAlert',
    severity: alertData.severity || 'warning',
    status: alertData.status || 'firing',
    summary: alertData.summary || 'Alert triggered by system metric anomaly',
    timestamp: new Date().toLocaleTimeString()
  };
  activeAlerts.unshift(newAlert);
  broadcast({ type: 'ALERT_UPDATE', alerts: activeAlerts });
  res.status(200).json({ status: 'received' });
});

// Query live alerts
app.get('/api/alerts', (req, res) => {
  res.json({
    activeAlerts,
    history: recentAlertHistory,
    totalFiring: activeAlerts.filter(a => a.status === 'firing').length
  });
});

// Create HTTP server
const server = http.createServer(app);

// WebSocket Server for live push telemetry
const wss = new WebSocket.Server({ server });

function broadcast(data) {
  const payload = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// Live telemetry broadcast loop
let telemetryTick = 0;
setInterval(() => {
  telemetryTick++;

  // Calculate live dynamic metrics
  let cpu = chaosState.cpuSpike ? (91.0 + Math.random() * 7) : (20.0 + Math.random() * 8);
  let memory = 180 + Math.random() * 20;
  let rps = Math.floor(45 + Math.random() * 30);
  let latency = chaosState.highErrorRate ? (1200 + Math.random() * 300) : (18 + Math.random() * 12);
  let errorRate = chaosState.highErrorRate ? (45.0 + Math.random() * 25) : 0.0;

  // Sync Alertmanager alert states based on active conditions
  activeAlerts = [];
  if (chaosState.cpuSpike) {
    activeAlerts.push({
      id: 'ALT-101',
      name: 'HighCPUUsage',
      severity: 'warning',
      layer: 'Infrastructure',
      summary: `Pod CPU utilization reached ${cpu.toFixed(1)}% (Threshold > 85%)`,
      timestamp: new Date().toLocaleTimeString(),
      status: 'firing'
    });
  }
  if (chaosState.highErrorRate) {
    activeAlerts.push({
      id: 'ALT-102',
      name: 'HighHttpErrorRate',
      severity: 'critical',
      layer: 'Application',
      summary: `5xx Error rate surged to ${errorRate.toFixed(1)}% (Threshold > 5%)`,
      timestamp: new Date().toLocaleTimeString(),
      status: 'firing'
    });
  }
  if (chaosState.crashLoopCount > 3) {
    activeAlerts.push({
      id: 'ALT-103',
      name: 'PodCrashLoop',
      severity: 'critical',
      layer: 'Kubernetes',
      summary: `Pod container restarted ${chaosState.crashLoopCount} times. BackOff triggered.`,
      timestamp: new Date().toLocaleTimeString(),
      status: 'firing'
    });
  }

  broadcast({
    type: 'TELEMETRY',
    data: {
      cpu: cpu.toFixed(1),
      memory: memory.toFixed(1),
      rps,
      latency: latency.toFixed(0),
      errorRate: errorRate.toFixed(1),
      restarts: chaosState.crashLoopCount,
      activeAlerts,
      timestamp: new Date().toLocaleTimeString()
    }
  });
}, 2000);

server.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`🚀 VLE-7 DevOps Monitoring Command Center Live on Port ${PORT}`);
  console.log(`🌐 Web UI & Dashboard: http://localhost:${PORT}`);
  console.log(`📊 Prometheus Metrics:  http://localhost:${PORT}/metrics`);
  console.log(`☸️ Kubernetes Health:   http://localhost:${PORT}/api/health/live`);
  console.log(`================================================================`);
});
