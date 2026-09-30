#!/usr/bin/env bash
# ==============================================================================
# VLE-7 Phase 3: Kubernetes Deployment Automation
# ==============================================================================

set -e

echo "☸️ [PHASE 3] Deploying Kubernetes Application Manifests..."

if command -v kubectl &> /dev/null; then
    echo "📋 Validating manifest syntax with kubectl dry-run..."
    kubectl apply --dry-run=client -f k8s/configmap.yaml
    kubectl apply --dry-run=client -f k8s/deployment.yaml
    kubectl apply --dry-run=client -f k8s/service.yaml
    echo "✅ Manifests passed client-side validation."

    # If cluster is reachable, apply
    if kubectl cluster-info &> /dev/null; then
        echo "🚀 Applying configurations to active Kubernetes cluster..."
        kubectl apply -f k8s/configmap.yaml
        kubectl apply -f k8s/deployment.yaml
        kubectl apply -f k8s/service.yaml
        kubectl get deployments,services,pods -l app=myapp
    else
        echo "ℹ️ No active Kubernetes cluster connected. Manifests verified in dry-run mode."
    fi
else
    echo "⚠️ kubectl not found in PATH. Skipping cluster apply."
fi

echo "✅ [PHASE 3 COMPLETE] Kubernetes deployment manifests ready."
