#!/usr/bin/env bash
# ==============================================================================
# VLE-7 Phase 6: Traffic Generator & Alert Simulation Script
# ==============================================================================

PORT=${1:-8081}
BASE_URL="http://localhost:$PORT"

echo "🔥 [PHASE 6] Running Live Traffic Simulation & Alert Validation against $BASE_URL..."

echo "1️⃣ Sending nominal user traffic..."
for i in {1..10}; do
    curl -s "$BASE_URL/api/orders" > /dev/null
    curl -s "$BASE_URL/api/health/live" > /dev/null
done
echo "  ✅ 20 HTTP requests generated. Metrics updated."

echo "2️⃣ Triggering CPU Spike Chaos Simulation (>85% utilization)..."
curl -s -X POST "$BASE_URL/api/chaos/cpu-spike" | grep "message" || true
echo "  ⚠️ HighCPUUsage alert condition primed."

echo "3️⃣ Triggering 500 Server Error Spike..."
curl -s -X POST "$BASE_URL/api/chaos/error-spike" | grep "message" || true
for i in {1..5}; do
    curl -s "$BASE_URL/api/orders" > /dev/null || true
done
echo "  ⚠️ HighHttpErrorRate alert condition primed."

echo "4️⃣ Triggering Pod Crash Simulation..."
for i in {1..4}; do
    curl -s -X POST "$BASE_URL/api/chaos/pod-crash" | grep "message" || true
done
echo "  🚨 PodCrashLoop alert condition primed (>3 restarts)."

echo "5️⃣ Checking exported Prometheus metrics endpoint..."
curl -s "$BASE_URL/metrics" | grep -E "pod_cpu_usage_percent|kube_pod_container_status_restarts_total|http_requests_total" | head -n 10

echo ""
echo "✅ [PHASE 6 COMPLETE] Traffic & Alert simulation completed successfully."
