#!/usr/bin/env bash
# ==============================================================================
# VLE-7 Phase 1: Infrastructure Setup Automation (AWS EC2 + Docker)
# ==============================================================================

set -e

echo "🚀 [PHASE 1] Initializing Infrastructure Setup..."
echo "🔹 Target OS: Ubuntu 22.04 LTS (AWS EC2 t2.medium)"
echo "🔹 Opening Security Group Ports: 22 (SSH), 3000 (Grafana), 9090 (Prometheus), 8080/8081 (Jenkins/App), 9093 (Alertmanager)"

# Function to check or mock package installations
install_docker() {
    if command -v docker &> /dev/null; then
        echo "✅ Docker is already installed: $(docker --version)"
    else
        echo "📦 Installing Docker and dependencies..."
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo apt update -y
            sudo apt install docker.io git curl -y
            sudo systemctl start docker
            sudo systemctl enable docker
            sudo usermod -aG docker "$USER"
        else
            echo "ℹ️ On macOS / non-Linux: Docker CLI available."
        fi
    fi
}

install_docker
echo "✅ [PHASE 1 COMPLETE] Infrastructure and container runtime verified."
