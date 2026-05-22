# Plane Tracker Web App — Project Guidelines

Guidelines for a new repository: a mobile-friendly **React web app** that lets
the maintainer and a few pilot friends look up flights logged by the
[`plane-tracker-rgb-pi`](https://github.com/) project.

> This is a *companion* project. It has its own repo. It does **not** modify the
> tracker or its hardware — it only consumes the existing flight-query API.

---

## 1. The decision

Build a **mobile-friendly web app** (a React single-page app served as static
files), **not** a native iOS app and **not** a React Native app.

### Why web, not native

| Factor | Native iOS / React Native | Mobile web app |
| --- | --- | --- |
| Apple code-signing | Required (certificates, provisioning profiles) | None |
| Distribution | App Store / TestFlight / ad-hoc | Share a URL |
| Build expiry | 7 days (free Apple ID) or ~1 yr (paid) | Never expires |
| Up-front cost | $99/yr developer account (realistically) | $0 |
| Install friction for friends | Each device must be provisioned | Open a link |
| Hosting cost | $0 (runs on device) | ~$0 (see §4) |

For a personal app shared with a handful of people, the web route removes every
Apple-specific hurdle and costs effectively nothing. The trade-off — limited
access to device hardware and weaker offline support — does not matter for a
read-only flight lookup tool.

---

## 2. Architecture

```
┌─────────────────┐     HTTPS      ┌──────────────────┐
│  React SPA      │ ─────────────▶ │  API Gateway     │
│  (static files) │   GET /flights │  (REST, regional)│
│  on CDN host    │ ◀───────────── │        │         │
└─────────────────┘     JSON       │        ▼         │
        ▲                          │  Lambda          │
        │ browser                  │  (flight-query)  │
   ┌────┴────┐                     │        │         │
   │ phone   │                     │        ▼         │
   └─────────┘                     │  DynamoDB        │
                                   │  (tracker_log)   │
                                   └──────────────────┘
```

- **Frontend** — a React SPA built to static HTML/CSS/JS, served from a CDN host.
- **Backend** — *already exists* in the `plane-tracker-rgb-pi` repo under `api/`
  (API Gateway + Lambda + DynamoDB). This project does not build a new backend.
- **No new database** — the app reads the existing `tracker_log` DynamoDB table
  through the API. It stores nothing of its own.

---

## 3. Hosting

Serve the built static files from a free static host with a global CDN and
automatic HTTPS:

- **Cloudflare Pages**, **Netlify**, **Vercel**, or **GitHub Pages** — any is fine.
- Connect the existing custom domain (already owned — no new purchase).
- TLS certificates are issued and renewed automatically by the host.
- Deploy on push to the main branch (CI is built into all of the above).

The backend stays where it is — deployed from the `plane-tracker-rgb-pi/api`
CloudFormation/SAM stack.

---

## 4. Cost

Adding this web app costs **effectively $0/month**. The backend already exists;
the only new thing is static hosting, which is free.

| Resource | Pricing | Cost at "me + a few friends" |
| --- | --- | --- |
| Static frontend hosting | Free tier (Cloudflare Pages / Netlify / etc.) | $0 |
| Domain | Already owned | $0 |
| API Gateway (REST, regional) | $3.50 / million requests | ~$0.03/mo |
| Lambda (arm64, 128 MB) | 1M req + 400k GB-s/mo always free | $0 |
| CloudWatch Logs (30-day retention) | 5 GB ingest/mo free | $0 |
| DynamoDB (provisioned, small) | 25 WCU + 25 RCU + 25 GB always free | $0 |
| Data transfer out | 100 GB/mo free | $0 |

Estimate basis: ~5 users × ~10 app opens/day × ~5 API calls ≈ **7,500
requests/month** — fractions of a cent, with everything else inside permanent
AWS free tiers.

**Cost notes / footguns avoided:**
- The backend Lambda is **not** in a VPC, so there is no NAT Gateway (~$32/mo).
- The backend uses a free SSM parameter, **not** AWS Secrets Manager.
- Watch for accidental introduction of always-on compute (a VM/container bills
  24/7) — keep the frontend static and the backend serverless.

---

## 5. The backend API (what already exists)

A single read-only endpoint, defined in `plane-tracker-rgb-pi/api/template.yaml`:

```
GET /flights
```

- Queries the `tracker_log` DynamoDB table by **callsign**, with an optional
  **time window** (default ±15 min around a supplied timestamp).
- Returns at most **50 items** for a callsign-only query.
- Timestamps with no offset are interpreted in a configurable IANA timezone
  (UTC by default).
- Throttled to ~5 req/s steady-state, 10 burst.

The web app is constrained to what this endpoint exposes. Any new capability
(e.g. "list recent flights", search by other fields) requires a backend change
in the `plane-tracker-rgb-pi` repo — out of scope for this repo.

---

## 6. Required backend changes before launch

Two changes are needed in `plane-tracker-rgb-pi/api/` before a browser app can
use the API. **Track these as blockers.**

1. **Authentication — replace the IP allowlist.**
   The API currently authorizes callers by matching their source IP against a
   CIDR allowlist (SSM parameter `/plane-tracker/api/allowed-cidrs`). Pilot
   friends on mobile networks have constantly-changing IPs, so allowlisting
   cannot work. Replace it with one of:
   - an **API key** (simplest), or
   - a **shared bearer token**, or
   - **Amazon Cognito** (most robust, most setup).

2. **CORS.**
   The API defines only `GET /flights` with no CORS configuration. A browser
   calling it from the app's domain will be blocked until `OPTIONS` handling
   and CORS response headers are added to the API definition.

> Optional cost micro-optimization: the API uses a REST API ($3.50/M requests).
> An HTTP API ($1.00/M) is cheaper, but at this traffic the difference is a
> rounding error — not worth changing.

---

## 7. Recommended frontend stack

- **React + Vite** — fast builds, simple static output. (Create React App is
  deprecated; do not use it.)
- **TypeScript** — recommended.
- **Routing** — React Router, only if more than one view is needed.
- **Data fetching** — `fetch` is enough for one endpoint; TanStack Query if
  caching/retries become useful.
- **Styling** — maintainer's choice (Tailwind, CSS Modules, plain CSS). Keep it
  light; this is a small app.
- **Mobile-first** — design for a phone screen first; it is the primary target.

### PWA / "add to home screen" (optional)

Add a web app manifest and a minimal service worker so the app can be installed
to a phone's home screen and launch full-screen like a native app. This is the
closest thing to a native install with none of the Apple overhead. Treat it as
a nice-to-have, not a launch blocker.

---

## 8. Out of scope

- Changes to the tracker hardware, render loop, or LED display code.
- New backend endpoints or schema changes (belong in `plane-tracker-rgb-pi`).
- A database of its own — the app is stateless and read-only.
- App Store / TestFlight distribution.

---

## 9. Open decisions

- [ ] Which static host (Cloudflare Pages vs Netlify vs Vercel vs GitHub Pages).
- [ ] Auth mechanism for the API (API key vs token vs Cognito).
- [ ] Subdomain for the app (e.g. `flights.example.com`).
- [ ] Whether to ship the PWA manifest/service worker at launch or later.
- [ ] TypeScript vs plain JavaScript.
