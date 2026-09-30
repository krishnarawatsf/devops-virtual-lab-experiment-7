# 📑 Virtual Lab Experiment 7: Full DevOps Monitoring System (AWS + K8s + CI/CD + Alerts)

**Course:** DevOps & Cloud Engineering  
**Student Name:** Krishna Rawat  
**Repository:** [https://github.com/krishnarawatsf/devops-virtual-lab-experiment-7](https://github.com/krishnarawatsf/devops-virtual-lab-experiment-7)  
**Date:** September 2026  

---

## 🎯 1. Objective
To design, implement, and deploy an enterprise-grade **End-to-End DevOps Monitoring & Observability System** integrating:
- **Cloud Infrastructure:** Amazon Web Services (AWS EC2 / EKS)
- **Container Orchestration:** Kubernetes (Minikube / Cluster)
- **Continuous Integration & Delivery:** Jenkins Multi-Branch Pipeline
- **Time-Series Metric Scraping:** Prometheus
- **Golden Signal Visualization:** Grafana Dashboards
- **Intelligent Alert Routing:** Prometheus Alertmanager (Slack / Webhook / Email)

---

## 🏗️ 2. Architectural Design

```mermaid
flowchart TD
    subgraph Developer["👨‍💻 Source Control"]
        Dev[Developer Workstation] -->|git push| Git[GitHub Repository]
    end

    subgraph CI_CD["⚙️ CI/CD Engine (Jenkins)"]
        Git -->|Webhook Trigger| J_Checkout[Stage 1: Checkout]
        J_Checkout --> J_Lint[Stage 2: Static Analysis]
        J_Lint --> J_Test[Stage 3: Automated Unit/Metric Tests]
        J_Test --> J_Docker[Stage 4: Multi-Stage Docker Build]
        J_Docker --> J_Scan[Stage 5: Security Audit]
        J_Scan --> J_Deploy[Stage 6: Deploy to Kubernetes]
        J_Deploy --> J_Verify[Stage 7: Prometheus Verification]
    end

    subgraph K8S_Cluster["☸️ Kubernetes Cluster (AWS / Minikube)"]
        J_Deploy -->|kubectl apply| Deploy[Deployment: myapp (2 Replicas)]
        Deploy --> Pod1[Pod: myapp-pod-1]
        Deploy --> Pod2[Pod: myapp-pod-2]
        SVC[Service: myapp-service (NodePort 30080)] --> Pod1
        SVC --> Pod2
        HPA[Horizontal Pod Autoscaler (CPU 75%)] -.-> Deploy
    end

    subgraph Observability["📊 Monitoring & Alerting Stack"]
        Prom[Prometheus Server (Port 9090)] -->|Pull Scrape /metrics every 15s| SVC
        Prom -->|Scrape Host Metrics| NodeExp[Node Exporter (9100)]
        Grafana[Grafana Dashboards (Port 3000)] -->|Query PromQL| Prom
        Prom -->|Evaluate Alert Rules (15s)| Alertmgr[Alertmanager (Port 9093)]
        Alertmgr -->|Routing Tree| Slack[Slack #alerts-critical]
        Alertmgr -->|Webhook| Webhook[DevOps Command Center]
    end
```

---

## 📋 3. Step-by-Step Execution Record

### Phase 1: Cloud Infrastructure Setup (AWS EC2)
1. **EC2 Provisioning:** Ubuntu 22.04 LTS instance (`t2.medium`).
2. **Security Group Ingress Configuration:**
   - Port 22 (SSH Remote Access)
   - Port 8080 / 8081 (Jenkins & App Endpoint)
   - Port 9090 (Prometheus Metrics TSDB)
   - Port 3000 (Grafana Dashboard UI)
   - Port 9093 (Prometheus Alertmanager)
   - Port 30080 (Kubernetes NodePort)
3. **Container Runtime:** Docker CE installed and enabled as a systemd service.

### Phase 2: CI/CD Pipeline Automation (Jenkins)
1. **Jenkinsfile Implementation:** Multi-stage declarative pipeline.
2. **Key Stages:**
   - `Checkout Source Code`
   - `Code Linting & Static Analysis`
   - `Unit & Smoke Tests` (9/9 automated checks passed)
   - `Docker Image Build & Tag` (`krishnarawatsf/devops-monitoring-app:v1.0.0`)
   - `Container Vulnerability Scan`
   - `Kubernetes Manifest Validation` (`kubectl apply --dry-run=client`)
   - `Deploy to Kubernetes Cluster` (Rolling update with zero downtime)
   - `Prometheus & Monitoring Health Verification`

### Phase 3: Kubernetes Orchestration
1. **Deployment (`k8s/deployment.yaml`):** 2 replicas, rolling update strategy (`maxSurge: 1`, `maxUnavailable: 0`), resource requests/limits, HTTP liveness (`/api/health/live`) and readiness probes (`/api/health/ready`).
2. **Service (`k8s/service.yaml`):** NodePort service on port 30080 targeting port 8080 with Prometheus annotations (`prometheus.io/scrape: "true"`).
3. **Autoscaling (`k8s/hpa.yaml`):** HPA scaling between 2 to 10 pods when CPU utilization exceeds 75%.

### Phase 4: Prometheus & Grafana Monitoring
1. **Prometheus Configuration (`monitoring/prometheus/prometheus.yml`):**
   - Scrape jobs for `myapp-kubernetes`, `prometheus`, `node-exporter`, and `jenkins-ci`.
   - Global scrape interval: 15s.
2. **Custom Application Telemetry (`src/app.js`):**
   - `http_requests_total` (Counter with method, route, status code)
   - `http_request_duration_seconds` (Histogram with latency buckets)
   - `pod_cpu_usage_percent` (Gauge)
   - `pod_memory_usage_megabytes` (Gauge)
   - `kube_pod_container_status_restarts_total` (Counter for CrashLoopBackOff detection)
3. **Grafana Dashboards:** Provisioned dashboards visualizing Google's Four Golden Signals (Latency, Traffic, Errors, Saturation).

### Phase 5: Prometheus Alertmanager & Chaos Verification
1. **Alert Rules Configured (`monitoring/prometheus/alert_rules.yml`):**
   - `PodCrashLoop`: Restarts > 3 within 5 minutes (`severity: critical`).
   - `HighCPUUsage`: Pod CPU > 85% for 1 minute (`severity: warning`).
   - `NodeDown`: Scrape target unreachable (`up == 0`, `severity: critical`).
   - `HighHttpErrorRate`: 5xx error rate > 5% (`severity: critical`).
   - `HighServiceLatency`: P95 latency > 1000ms (`severity: warning`).
2. **Alertmanager Routing (`monitoring/alertmanager/alertmanager.yml`):**
   - Critical alerts dispatched to PagerDuty/Webhook and `#alerts-critical`.
   - Warning alerts routed to `#devops-monitoring`.
   - Inhibition rules prevent cascading duplicate alerts when a node goes down.

---

## 🧪 4. Automated Test & Verification Results

```text
=================================================================
🚀 VLE-7: Full DevOps Monitoring System - Automated Test Runner
=================================================================

--- 🧪 Running Unit & Prometheus Metric Tests ---
  ✅ Metric registry initialized with default & custom metrics
  ✅ Prometheus Gauge correctly tracks CPU utilization
  ✅ Pod restart counter increments accurately for CrashLoopBackOff detection
  ✅ Application state and chaos engineering hooks verified
  🎉 All Unit Tests Passed (4/4)

--- ☸️ Running Kubernetes Manifest Validation Tests ---
  ✅ Manifest files exist in k8s/ directory
  ✅ Deployment manifest adheres to production specs & Prometheus annotations
  ✅ Service manifest is valid and routes traffic to backend pods
  🎉 All Kubernetes Validation Tests Passed (3/3)

--- 🔔 Running Prometheus & Alertmanager Rule Tests ---
  ✅ Alert rules defined: PodCrashLoop, HighCPUUsage, NodeDown, HighHttpErrorRate
  ✅ Alertmanager routing and notification channels configured
  🎉 All Alert Rules Validation Tests Passed (2/2)

=================================================================
🏆 SUMMARY: 100% of Test Suites Passed Successfully! (9/9 Checks)
=================================================================
```

---

## 🎓 5. Comprehensive Viva Voce Questions & Answers

### Q1: What is the fundamental difference between Continuous Integration (CI), Continuous Delivery (CD), and Continuous Deployment (CD)?
**Answer:**
- **Continuous Integration (CI):** Frequent merging of code into a shared repository, verified by automated builds and test suites to identify integration defects immediately.
- **Continuous Delivery (CD):** Ensures code is always in a deployable state by automating packaging, environment provisioning, and deployment into staging. Deployment to production requires manual sign-off.
- **Continuous Deployment:** Extends Continuous Delivery by automatically releasing every build that passes the testing pipeline directly to production without human intervention.

### Q2: How does Prometheus scrape metrics from Kubernetes workloads?
**Answer:**
Prometheus operates on a **pull-based model**. It regularly makes HTTP GET requests to configured endpoints (typically `/metrics`) exposed by targets. In Kubernetes, Prometheus uses the Kubernetes API server for service discovery to dynamically locate pods and services annotated with `prometheus.io/scrape: "true"`, automatically maintaining an active scrape target list.

### Q3: What are the Four Golden Signals of Monitoring defined by Google SRE?
**Answer:**
1. **Latency:** The duration required to process a request (tracking latency for successful vs. failed requests).
2. **Traffic:** The measure of demand placed on the system (e.g., requests per second, bandwidth).
3. **Errors:** The rate of requests failing explicitly (e.g., HTTP 500s) or implicitly.
4. **Saturation:** The measure of system capacity utilization, highlighting the most constrained resource (CPU, memory, thread pool).

### Q4: What is the role of Alertmanager in the Prometheus ecosystem?
**Answer:**
Alertmanager receives raw firing alerts from Prometheus servers and handles:
- **Deduplication:** Merging alerts from redundant Prometheus instances.
- **Grouping:** Bundling related alerts into a single notification.
- **Routing:** Sending alerts to appropriate receivers based on labels (`severity`, `team`, `service`).
- **Inhibition:** Suppressing subordinate alerts when a root-cause alert is already firing (e.g., suppressing pod alerts when the entire node is down).
- **Silencing:** Muting alerts during planned maintenance windows.

### Q5: What is the difference between a Kubernetes Pod, Deployment, and Service?
**Answer:**
- **Pod:** The atomic deployable unit containing one or more co-located containers sharing localhost networking and storage volumes.
- **Deployment:** A higher-level controller providing declarative updates for Pods (scaling, rolling updates, rollbacks, and self-healing).
- **Service:** An abstraction defining a durable IP and DNS endpoint to load-balance traffic across an ephemeral set of Pods matching label selectors.

---

## 🏁 6. Conclusion
The **VLE-7: Full DevOps Monitoring System** was successfully architected, built, tested, and demonstrated. The complete pipeline links cloud infrastructure, automated multi-stage CI/CD, containerized Kubernetes microservices, Prometheus time-series metric collection, Grafana real-time visualization, and Alertmanager incident handling into a cohesive, production-ready DevOps loop.
