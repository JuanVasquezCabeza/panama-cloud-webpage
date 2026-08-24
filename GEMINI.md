# GEMINI.md - Minos Solutions High-Density Development Cloud

This repository contains the blueprints and codebase for the **Minos Solutions** high-density self-hosted infrastructure and interactive corporate portal. It is designed to guide future developers and AI agents in maintaining, expanding, and deploying this architecture.

---

## 1. Architectural Overview

The infrastructure utilizes a highly cost-effective, secure, and low-latency hybrid cloud topography:

```
[Local Dev Mac] -> (Git Push) -> [GitHub]
                                    |
                             (Webhook Event)
                                    v
[Visitor] -> [Cloudflare Edge (BOG/MDE/PTY)] -> [Hetzner VPS (Ubuntu 24.04)]
               (Instant 15ms Cache)               (Coolify Docker PaaS <10MB RAM)
```

### Server Node Telemetry
* **IP Address:** `91.99.168.106`
* **Provider:** Hetzner Cloud (Nuremberg, Germany Region - CX23)
* **Specifications:** 4GB RAM, 40GB NVMe Storage, 1 vCPU
* **Operating System:** Ubuntu 24.04 LTS (x86_64)
* **Control Plane:** Coolify (Self-hosted Port 8000)
* **Routing Path:** Cloudflare Proxied (Orange Cloud) -> VPS Port 80 / 443

---

## 2. Hardening & Performance Configurations (Task 1)

The server prep script (`prepare-server.sh`) applied three critical production-level hardens:

1. **Virtual Swap File (2GB):** Located at `/swapfile`. Protects the server from Linux Out-Of-Memory (OOM) crashes during concurrent Docker builds in Coolify.
2. **Kernel Swappiness (`vm.swappiness=10`):** Set in `/etc/sysctl.d/99-coolify-swappiness.conf`. Instructs the kernel to prioritize physical RAM speed and only swap idle blocks to SSD under severe memory thresholds.
3. **UFW Firewall:**
   * Default Policy: Deny Incoming, Allow Outgoing
   * Allowed Ports: `22/tcp` (SSH), `80/tcp` (HTTP), `443/tcp` (HTTPS), `8000/tcp` (Coolify Dashboard).

---

## 3. The Webpage Application Container (Task 2)

The codebase resides inside `/webpage`. It is structured to maintain a **sub-10MB RAM footprint** in production.

### File Manifest
* **`index.html`:** Clean, framework-free, highly responsive corporate page themed with enterprise light aesthetics and interactive math simulators.
* **`nginx.conf`:** Custom tuned Nginx configuration:
  * `worker_processes 1;` to limit CPU and RAM overhead.
  * Disabled access logging (`access_log off;`) to eliminate disk IO operations.
  * Customized small HTTP buffer sizes (`client_body_buffer_size 10k;`, `client_header_buffer_size 1k;`) to prevent RAM bloat.
  * `/healthz` endpoint returning `200 OK` for Coolify zero-downtime health monitoring.
* **`Dockerfile`:**
  * **Stage 1 (Asset-Validator):** Clean `alpine:3.18` verification stage. Validates HTML semantic tags before build.
  * **Stage 2 (Production):** Bundles validated assets into an ultra-slim `nginx:alpine3.18-slim` runner.

---

## 4. Minos Engineering Labs (Interactive Simulators)

The webpage includes three custom client-side mathematical engines built in vanilla JS and responsive SVGs:

1. **Model 01: Marketing Mix Modeling (MMM) Saturation**
   * *Formula:* $R = L \times (1 - e^{-\alpha \cdot S})$ (where $R$ is Revenue, $S$ is Spend, $L$ is max return, and $\alpha$ is decay).
   * *Math features:* Calculates the marginal ROI (first derivative $dR/dS$). Alerts users when they enter the "Saturated" region (Marginal ROI $< 1.0x$).
2. **Model 02: Agile Sprint Capacity & Scope Simulator**
   * *Formula:* Plots a 10-day burndown chart incorporating unplanned scope creep and team hour capacity against story points. If capacity is insufficient, it displays expected delays and flags the sprint as "Incomplete".
3. **Model 03: Enterprise AI & RAG Cost-Optimizer**
   * *Formula:* Compares linear rising SaaS Token pricing ($0.015/query scaling with chunk size) against a flat-rate self-hosted Llama-3 microservice ($450/month flat server cost). Demonstrates the enterprise volume crossover point.

---

## 5. Developer & Agent Workflows (GitOps)

### Making Copy or Functional Changes
Future developers or AI agents can make updates directly by modifying local files inside `/webpage/` and running Git commands.

```bash
# 1. Navigate to webpage
cd ~/Development/panama-cloud/webpage

# 2. Stage and Commit
git add .
git commit -m "feat: your descriptive commit message"

# 3. Push to GitHub
git push
```

### The CI/CD Pipeline
* The GitHub repository is configured with a webhook directly linked to your Coolify server.
* On every `git push` to `main`, GitHub pings Coolify.
* Coolify pulls the code, executes the multi-stage Docker build, checks the `/healthz` path, and hot-swaps the container with **zero downtime**.

### Client-Side Telemetry Edge-Detection
* The page includes a script (`detectEdgeNode`) that queries `/cdn-cgi/trace` on your domain on load.
* It parses Cloudflare's Active Colo code (e.g. `BOG`, `MDE`, `PTY`, `MIA`) and dynamically updates the header badge to display the visitor's local cached edge node.

---

## 6. Maintenance Commands Reference

### SSH Access (Bypassing Passphrase after initial load)
Since the SSH private key is passphrase protected, always ensure your local Mac agent is running so automated scripts do not block:
```bash
ssh-add ~/.ssh/id_ed25519
# Verify working connection
ssh -o StrictHostKeyChecking=no root@91.99.168.106 "uname -a"
```

### Checking Container Memory Consumption on VPS
SSH into the server and inspect the running Docker container resources:
```bash
docker stats --no-stream
```
*(Verify that the webpage container is occupying less than 10MB of RAM under active load).*
