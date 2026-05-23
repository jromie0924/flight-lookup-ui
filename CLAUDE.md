# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server (binds `0.0.0.0` so phones on the LAN can connect).
- `npm run build` — `tsc -b && vite build`; static output to `dist/`.
- `npm run typecheck` — TypeScript only, no emit. There is no test suite and no linter configured.
- `npm run preview` — serve the production build locally.
- `./infra/deploy.sh` — build + sync `dist/` to S3 + invalidate CloudFront. Pulls `VITE_API_KEY` from SSM (`/plane-tracker/api/key` in `us-east-2`) at build time, so AWS creds are required even for a local production build.

## Architecture

This is a **read-only companion** to a separate project. There is no backend, database, router, or test framework in this repo — keep it that way unless the user asks otherwise.

### The backend is owned elsewhere

The API lives in the sibling repo `plane-tracker-rgb-pi` (API Gateway + Lambda + DynamoDB). This UI only calls `GET /flights?callsign=...&timestamp=...&key=...`. Any new field, query, or endpoint requires a change in that repo — do not try to work around the API surface here. See `flight-lookup-ui-guidelines.md` §5–6 for the full constraints (50-row cap, ±15 min window, ~5 req/s throttle).

### The CORS dev-proxy is load-bearing

The backend sends no CORS headers, so a browser cannot call it cross-origin. `vite.config.ts` reads `VITE_API_BASE_URL` from `.env` and sets up `/api` → real API as a server-side proxy; `src/api/flights.ts` switches its base URL to `/api` whenever `import.meta.env.DEV` is truthy. **Production builds call the API directly** and will break in a browser until the backend ships CORS headers — guidelines §6 tracks this as a launch blocker. Do not silently change the base-URL logic without understanding both branches.

### Auth is a query parameter, not a header

`VITE_API_KEY` is appended as `?key=...` (not `x-api-key`). The README's older `x-api-key` note is stale — match `src/api/flights.ts`. The key is baked into the bundle at build time; rotating it requires a redeploy.

### PWA auto-update is manual on purpose

`src/main.tsx` calls `registerSW({ immediate: true, onNeedRefresh: () => location.reload() })` and `vite.config.ts` sets `injectRegister: null` + `clientsClaim` + `skipWaiting`. The comments explain why: installed PWAs on phones rarely fully close, so without forcing an immediate SW takeover + reload, users sit on stale precached bundles indefinitely (e.g. the pre-API-key build). Don't "simplify" this back to the defaults.

### Response shape is intentionally loose

`FlightRecord` (in `src/types/flight.ts`) keeps every field optional plus an index signature because the backend forwards raw dump1090/readsb fields and the schema is owned downstream. `extractFlights` in `src/api/flights.ts` accepts a bare array or any of `flights`/`items`/`Items`/`data`/`results` wrappers for the same reason. New UI fields should be added defensively (`typeof x === 'number'`-style guards, like `FlightCard.buildDetails`), not by tightening the type.

### Hosting

CloudFormation stack in `infra/template.yaml`: private S3 + CloudFront (OAC) + ACM cert in `us-east-1`. DNS lives on **NameCheap**, not Route 53 — two manual CNAMEs (ACM validation + app subdomain → CloudFront). SPA fallback is configured via `CustomErrorResponses` mapping 403/404 → `/index.html` 200, so client-side routes will Just Work if one is ever added. `infra/README.md` has the one-time setup; `deploy.sh` is the every-deploy path.
