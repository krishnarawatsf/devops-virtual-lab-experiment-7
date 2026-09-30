// Initialize Lucide Icons
if (window.lucide) {
  lucide.createIcons();
}

// Chart.js global configurations
Chart.defaults.color = '#9ca3af';
Chart.defaults.font.family = "'JetBrains Mono', monospace";
Chart.defaults.font.size = 11;

// --- Chart 1: Pod Resources (CPU & Memory) ---
const resourceCtx = document.getElementById('resourceChart').getContext('2d');
const resourceChart = new Chart(resourceCtx, {
  type: 'line',
  data: {
    labels: Array(15).fill('').map((_, i) => `${i * 2}s ago`).reverse(),
    datasets: [
      {
        label: 'CPU Usage (%)',
        data: Array(15).fill(25),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.35,
        fill: true,
        yAxisID: 'y'
      },
      {
        label: 'Memory Usage (MB)',
        data: Array(15).fill(185),
        borderColor: '#10b981',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.35,
        yAxisID: 'y1'
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { boxWidth: 12 } }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' } },
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(255,255,255,0.04)' },
        title: { display: true, text: 'CPU %' }
      },
      y1: {
        min: 100,
        max: 300,
        position: 'right',
        grid: { drawOnChartArea: false },
        title: { display: true, text: 'Memory MB' }
      }
    }
  }
});

// --- Chart 2: Traffic & Latency ---
const trafficCtx = document.getElementById('trafficChart').getContext('2d');
const trafficChart = new Chart(trafficCtx, {
  type: 'line',
  data: {
    labels: Array(15).fill('').map((_, i) => `${i * 2}s ago`).reverse(),
    datasets: [
      {
        label: 'RPS (Requests/sec)',
        data: Array(15).fill(50),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.35,
        fill: true,
        yAxisID: 'y'
      },
      {
        label: 'Latency (ms)',
        data: Array(15).fill(22),
        borderColor: '#f59e0b',
        backgroundColor: 'transparent',
        tension: 0.35,
        yAxisID: 'y1'
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { boxWidth: 12 } }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' } },
      y: {
        min: 0,
        max: 120,
        grid: { color: 'rgba(255,255,255,0.04)' },
        title: { display: true, text: 'Req / sec' }
      },
      y1: {
        min: 0,
        max: 500,
        position: 'right',
        grid: { drawOnChartArea: false },
        title: { display: true, text: 'Latency (ms)' }
      }
    }
  }
});

// --- Tabs Navigation ---
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    const target = btn.getAttribute('data-tab');
    document.getElementById(target).classList.add('active');
  });
});

// --- Viva Voce Accordions ---
document.querySelectorAll('.viva-question').forEach(qBtn => {
  qBtn.addEventListener('click', () => {
    const parent = qBtn.parentElement;
    parent.classList.toggle('open');
  });
});

// --- Telemetry Logging Helper ---
const telemetryLogBox = document.getElementById('telemetryLogBox');
function appendLog(text, type = 'info') {
  const line = document.createElement('div');
  line.className = `log-line log-${type}`;
  line.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
  telemetryLogBox.appendChild(line);
  telemetryLogBox.scrollTop = telemetryLogBox.scrollHeight;
}

document.getElementById('btnClearLogs').addEventListener('click', () => {
  telemetryLogBox.innerHTML = '';
});

// --- Raw Metrics Fetcher ---
async function fetchRawMetrics() {
  try {
    const res = await fetch('/metrics');
    const text = await res.text();
    const filtered = text
      .split('\n')
      .filter(l => !l.startsWith('# HELP') && l.trim().length > 0)
      .slice(0, 20)
      .join('\n');
    document.getElementById('rawMetricsBox').textContent = filtered || text.slice(0, 800);
  } catch (err) {
    document.getElementById('rawMetricsBox').textContent = 'Error fetching /metrics: ' + err.message;
  }
}
document.getElementById('btnRefreshMetrics').addEventListener('click', fetchRawMetrics);
fetchRawMetrics();

// --- WebSocket Live Connection ---
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${protocol}//${window.location.host}`;
let ws;

function connectWebSocket() {
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    appendLog('WebSocket Telemetry link connected to DevOps Command Center', 'success');
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'TELEMETRY') {
        updateTelemetryUI(msg.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  ws.onclose = () => {
    setTimeout(connectWebSocket, 2500);
  };
}

connectWebSocket();

function updateTelemetryUI(data) {
  // Update KPI cards
  const cpu = parseFloat(data.cpu);
  const latency = parseFloat(data.latency);
  const errorRate = parseFloat(data.errorRate);

  document.getElementById('kpiCpu').textContent = `${data.cpu}%`;
  document.getElementById('barCpu').style.width = `${Math.min(cpu, 100)}%`;
  document.getElementById('kpiCpuSub').textContent = cpu > 85 ? '🚨 High CPU Threshold Exceeded!' : 'Baseline nominal';

  document.getElementById('kpiRps').textContent = `${data.rps} req/s`;

  document.getElementById('kpiLatency').textContent = `${data.latency} ms`;
  document.getElementById('barLatency').style.width = `${Math.min((latency / 500) * 100, 100)}%`;

  document.getElementById('kpiErrorRate').textContent = `${data.errorRate}%`;
  document.getElementById('barError').style.width = `${Math.min(errorRate, 100)}%`;
  document.getElementById('kpiErrorSub').textContent = errorRate > 5 ? '⚠️ 5xx Error Budget Exceeded!' : 'SLO: 99.9% Success';

  // Update Charts
  const nowLabel = new Date().toLocaleTimeString();
  
  // Resource Chart
  resourceChart.data.labels.shift();
  resourceChart.data.labels.push(nowLabel);
  resourceChart.data.datasets[0].data.shift();
  resourceChart.data.datasets[0].data.push(cpu);
  resourceChart.data.datasets[1].data.shift();
  resourceChart.data.datasets[1].data.push(parseFloat(data.memory));
  resourceChart.update('none');

  // Traffic Chart
  trafficChart.data.labels.shift();
  trafficChart.data.labels.push(nowLabel);
  trafficChart.data.datasets[0].data.shift();
  trafficChart.data.datasets[0].data.push(data.rps);
  trafficChart.data.datasets[1].data.shift();
  trafficChart.data.datasets[1].data.push(latency);
  trafficChart.update('none');

  // Update Alerts
  renderAlerts(data.activeAlerts);
}

function renderAlerts(alerts) {
  const alertFeed = document.getElementById('alertFeedList');
  const countBadge = document.getElementById('alertCountBadge');

  if (!alerts || alerts.length === 0) {
    countBadge.textContent = '0 Firing';
    countBadge.className = 'badge badge-success';
    alertFeed.innerHTML = `
      <div class="alert-empty-state">
        <i data-lucide="shield-check" class="empty-icon"></i>
        <h4>All Systems Nominal</h4>
        <p>Prometheus rules evaluating every 15s. No firing alerts currently.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  countBadge.textContent = `${alerts.length} Firing`;
  countBadge.className = 'badge badge-accent bg-red';

  alertFeed.innerHTML = alerts.map(a => `
    <div class="alert-card-item alert-card-${a.severity}">
      <div class="alert-item-header">
        <span class="alert-item-title">
          <i data-lucide="${a.severity === 'critical' ? 'alert-octagon' : 'alert-triangle'}"></i>
          [${a.severity.toUpperCase()}] ${a.name}
        </span>
        <span class="badge ${a.severity === 'critical' ? 'badge-accent bg-red' : 'btn-warning'}">${a.layer}</span>
      </div>
      <p class="alert-item-desc">${a.summary}</p>
      <span class="step-duration">${a.timestamp} • Active</span>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

// --- Chaos Action Handlers ---
document.getElementById('btnChaosCpu').addEventListener('click', async () => {
  appendLog('Injecting Chaos: Pod CPU Spike (>85%)...', 'warn');
  await fetch('/api/chaos/cpu-spike', { method: 'POST' });
});

document.getElementById('btnChaosErrors').addEventListener('click', async () => {
  appendLog('Injecting Chaos: 500 HTTP Server Error Storm...', 'error');
  await fetch('/api/chaos/error-spike', { method: 'POST' });
});

document.getElementById('btnChaosCrash').addEventListener('click', async () => {
  appendLog('Injecting Chaos: Simulating Pod Crash / Restart...', 'error');
  await fetch('/api/chaos/pod-crash', { method: 'POST' });
});

document.getElementById('btnChaosReset').addEventListener('click', async () => {
  appendLog('Restoring nominal baseline. Clearing all active chaos anomalies...', 'success');
  await fetch('/api/chaos/reset', { method: 'POST' });
});

// --- Traffic Generator ---
document.getElementById('btnGenerateTraffic').addEventListener('click', async () => {
  appendLog('Generating synthetic traffic burst (25 requests)...', 'info');
  for (let i = 0; i < 25; i++) {
    fetch('/api/orders').catch(() => {});
  }
  setTimeout(fetchRawMetrics, 500);
});

// --- Interactive Jenkins Pipeline Execution ---
const btnRunPipeline = document.getElementById('btnRunPipeline');
const btnTriggerPipelineStage = document.getElementById('btnTriggerPipelineStage');

async function triggerPipelineAnimation() {
  const steps = ['step-checkout', 'step-lint', 'step-test', 'step-docker', 'step-scan', 'step-k8s', 'step-verify'];
  const consoleBox = document.getElementById('jenkinsConsoleOutput');

  consoleBox.innerHTML = `[Pipeline] Starting Automated Multi-Branch Build #${Math.floor(100 + Math.random() * 900)}\n`;
  appendLog('Jenkins CI/CD Pipeline execution triggered...', 'info');

  for (let i = 0; i < steps.length; i++) {
    const el = document.getElementById(steps[i]);
    el.style.borderColor = '#6366f1';
    el.style.background = 'rgba(99, 102, 241, 0.15)';
    
    consoleBox.innerHTML += `[Pipeline] [Stage ${i+1}/${steps.length}] Running ${el.querySelector('h4').textContent}...\n`;
    consoleBox.scrollTop = consoleBox.scrollHeight;

    await new Promise(r => setTimeout(r, 600));

    el.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    el.style.background = 'rgba(16, 185, 129, 0.05)';
    consoleBox.innerHTML += `  -> Stage completed in ${el.querySelector('.step-duration').textContent} (SUCCESS)\n`;
  }

  consoleBox.innerHTML += `[Pipeline] Build & Deployment Finished: SUCCESS\n`;
  appendLog('Jenkins CI/CD Pipeline Build completed: Kubernetes deployment updated & Prometheus targets verified', 'success');
}

btnRunPipeline.addEventListener('click', triggerPipelineAnimation);
btnTriggerPipelineStage.addEventListener('click', triggerPipelineAnimation);
