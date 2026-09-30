#!/usr/bin/env bash
# ==============================================================================
# VLE-7 Stack Verification & Health Check Script
# ==============================================================================

set -e

echo "======================================================================"
echo "🧪 VLE-7 End-to-End DevOps Monitoring System Health Verification"
echo "======================================================================"

# 1. Manifest Checks
echo "1️⃣ Validating Kubernetes Manifests..."
node tests/k8s_validation.test.js

# 2. Alert Rules Checks
echo "2️⃣ Validating Prometheus & Alertmanager Configs..."
node tests/alert_rules.test.js

# 3. Unit & Metrics Checks
echo "3️⃣ Validating Prometheus Metric Exporters & App Logic..."
node tests/unit.test.js

echo "======================================================================"
echo "🎉 ALL VLE-7 STACK VERIFICATION GATES PASSED (100% HEALTHY)"
echo "======================================================================"
