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

---

## 7. Bilingual site (English + Spanish) — generated

The public site is **fully bilingual**: `/en/…` and `/es/…`, every page in both languages (the build fails if one is missing).
The team works in English; Spanish is marketing copy that lives **only in this repo** (the CRM is English and is never written to).

```bash
node tools/build-all.mjs     # rebuilds /en, /es, root entry page, sitemap.xml, robots.txt  (needs CRM read access for products)
node tools/check-site.mjs    # links, language switcher reciprocity, language purity, script syntax
node tools/serve.mjs         # local preview on http://localhost:8080
```

Then commit the generated files and push (Coolify deploys). **Never edit `en/`, `es/`, `index.html`, `sitemap.xml` by hand.**

| Page | EN URL | ES URL | Source |
| :--- | :--- | :--- | :--- |
| Home | `/en/` | `/es/` | `tools/build-home.mjs` (copy for both languages inside; uses the `saturation` and `readiness` widgets and statement-plus-evidence paragraphs) |
| Products & Solutions | `/en/products-and-solutions/` | `/es/productos-y-soluciones/` | CRM `product` catalog (English, read-only) + `content/products.es.json` (Spanish by product code) |
| Blog | `/en/blog/` | `/es/blog/` | `content/blog/reasons.json` (structure, titles, slugs, links between reasons) + `content/blog/<lang>/<slug>.md` |
| Partners | `/en/partners/` | `/es/aliados/` | `tools/build-partners-page.mjs` (program copy from `minos-crm/docs/agents/partners.md` §1–3; never publish scoring, tiers, example companies or commission terms) |
| Privacy Notice | `/en/privacy/` | `/es/privacidad/` | `tools/build-privacy-page.mjs` (DRAFT pending Juan's review; linked from the footer and every consent checkbox) |

**Language UX:** header switcher (EN / ES) always jumps to the *equivalent* page in the other language, remembers the choice in a `lang` cookie, `<html lang>` + `hreflang` alternates + canonical on every page, `x-default` = `/`. nginx redirects only `/` (cookie, then Accept-Language, then English); deep links are never redirected. `/products-and-solutions/` (old URL) 301s to `/en/…`.

**Adding a language-neutral change:** shared layout/nav/footer = `tools/lib.mjs`; design system = `tools/site.css`.

**Content rules:** no prices; never name Cognita (not citable); every example number is labelled illustrative; products with status RETIRED are hidden, DRAFT products show as "after the audit" without a button; CRM text starting with `TO DEFINE` is never published.

**Blog structure:** one pillar + six reasons, each reason linking to the related reasons with a one-sentence explanation (`links` in `reasons.json`). To add a reason: add it to `reasons.json` (both languages) and write both Markdown files.

**Forms:** the home audit form and the partners form POST to the CRM; see section 9.

## 8. Blog writing format and interactive explainers

**Paragraph format (enforced by `node tools/check-content.mjs`):** every body paragraph opens with a **bold statement** (the claim, rendered with a highlighter underline), followed by 3 to 5 supporting sentences with evidence and citations (inline links to the author/brand/study). Headings (`##`) and illustrative-example blockquotes (`>`) are the only exceptions.

**Citations:** only cite what was verified. Current verified sources: Binet & Field / IPA (60:40, 996 campaigns) + Ritson's caveat; Gordon, Zettelmeyer, Bhargava & Chapsky 2019 (Marketing Science, 15 Facebook experiments); Blake, Nosko & Tadelis (eBay paid search, NBER/Econometrica); Sethuraman, Tellis & Briesch 2011 (JMR; elasticity 0.12 short-term, 0.24 long-term); Flurry ATT opt-in (early 2021: ~12% worldwide, ~4% US) + EFF on ATT; Google Meridian (docs quotes: "privacy-durable", calibrate with experiments); Meta Robyn (README: privacy-safe, adstock and saturation curves, trend & season decomposition, budget allocation); Vaver & Koehler (Google geo experiments); Gartner 2025 CMO Spend Survey (7.7% of revenue, 59% too small, paid media 30.6%, 39% cutting agency budgets); RNL 2022 Cost of Recruiting (US private four-year median $2,795, up from $2,114); Broadbent 1979 (adstock); Quote Investigator on Wanamaker (attribution unconfirmed). Any new claim must be checked first; mark US data as such.

**Widgets:** 2 to 3 per article, same widgets in EN and ES (same order). Put `{{widget:name}}` on its own line in the Markdown. All logic and both languages' texts live in `assets/widgets.js` (15 widgets: readiness, value, map, attribution, halo, saturation, extra_budget, sandbox, cut, forecast, warning, visibility, needs, carryover, season). Numbers are stylised and labelled illustrative. Add a widget by defining `T.en.<name>`, `T.es.<name>` and `W.<name>` (defaults, controls, render), then run `node tools/test-widgets.mjs`.

**Checks before every push:**
```bash
node tools/build-all.mjs && node tools/check-site.mjs && node tools/check-content.mjs && node tools/test-widgets.mjs
```
`test-widgets` renders every widget in both languages over many states and simulates clicks/slider input with a fake DOM; it cannot judge layout, so look at the pages in a browser (`node tools/serve.mjs`) before publishing a new widget or layout change.

## 9. Website forms → CRM

Two forms, one shared markup module and one script:

* **Home audit form** (`/en/#audit`, `/es/#audit`, `interest: "client"`) and **partners form** (`/en/partners/#partner-form`, `/es/aliados/#partner-form`, `interest: "partner"`).
* Markup: `tools/forms.mjs` (labels in EN/ES; option **values** are API values and are never translated; countries are sent by English name). Styles: "Website request forms" block in `tools/site.css`.
* Submit logic: `assets/forms.js` → `POST /api/website-request` (same origin, JSON). On 2xx the form is replaced by a thank-you message; on any error the visitor gets a prefilled `mailto:info@minos.solutions` link.
* nginx (`nginx.conf`) proxies `location = /api/website-request` to the Twenty workflow webhook on `crm.minos.solutions`: POST only, 16k body limit, 5 requests/min per visitor (burst 3, keyed on `CF-Connecting-IP`, 429 when exceeded). The CRM hostname is resolved when nginx starts (no `resolver`), so if the CRM's IP changes nginx needs a restart/redeploy, and nginx refuses to start if the name cannot be resolved.
* The CRM side (workflow, dedupe, field mapping, spam handling with `hp` / `elapsedMs`) is documented in `minos-crm/docs/website-form.md`.

**Payload contract** (keep in sync with the CRM workflow; change both together):

```
{ interest: "client" | "partner",
  name, email, jobTitle, organization, website, country, city, phone, message,   // strings, "" when empty
  consent: true, consentText: "<exact consent sentence shown>", lang: "en" | "es", page: location.pathname,
  utm: { source, medium, campaign, term, content },   // "" when absent; from the URL, else from earlier in the visit (sessionStorage "minos_utm")
  hp: "<honeypot company_url, should be empty>", elapsedMs: <ms since the form was rendered>,
  // client only
  institutionType: K12_SCHOOL|K12_GROUP|UNIVERSITY|VOCATIONAL|ONLINE_EDTECH|OTHER, area: MARKETING|ADMISSIONS|EXECUTIVE|DATA_BI|OTHER,
  studentRange: UNDER_1000|FROM_1000_TO_3000|FROM_3000_TO_10000|OVER_10000, campusCount: number | null,
  channels: [SEARCH|SOCIAL|DISPLAY_VIDEO|RADIO_TV|OUTDOOR|EVENTS|OTHER],
  // partner only
  companyType: SIS_VENDOR|ADMISSIONS_CRM|MARKETING_AGENCY|TRAINING_EVENTS|ASSOCIATION|SCHOOL_MARKETPLACE|OTHER,
  collaboration: [REFERRAL|RESELLER|INTEGRATION|CO_MARKETING], institutionsServed, countriesServed }
```

Required in the UI: name, email, jobTitle, organization, country, consent, plus institutionType and area (client) or companyType (partner). Adding a field = `tools/forms.mjs` + `assets/forms.js` `payload()` + this contract + the CRM workflow.
