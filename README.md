# Flight Lookup UI

A mobile-friendly React web app to look up flights logged by the
[`plane-tracker-rgb-pi`](https://github.com/) project. It is a **read-only
companion** to the existing flight-query API — it has no backend or database of
its own.

See [`flight-lookup-ui-guidelines.md`](./flight-lookup-ui-guidelines.md) for the
full rationale, architecture, hosting plan, and cost notes.

## Stack

- **React 19 + Vite + TypeScript**
- **Plain CSS**, mobile-first, with a dark-mode variant
- **PWA** (installable to a phone home screen) via `vite-plugin-pwa`

## Getting started

```sh
npm install
cp .env.example .env    # then edit .env and set VITE_API_BASE_URL
npm run dev
```

Open the printed URL on a phone (same network) or in a desktop browser.

## Configuration

The app reads two build-time environment variables (see `.env.example`):

| Variable            | Purpose                                                                   |
| ------------------- | ------------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | Base URL of the flight-query API. The app calls `${VITE_API_BASE_URL}/flights`. |
| `VITE_API_KEY`      | Optional API key, sent as the `x-api-key` header.                         |

> **Backend blockers.** Per guidelines section 6, the API still authorizes by
> IP allowlist and sends no CORS headers. Until the backend gains an API
> key/token (or Cognito) and CORS support, a browser calling it will be
> blocked or rejected. Those changes live in the `plane-tracker-rgb-pi` repo.

## Scripts

| Command             | Description                                      |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Start the Vite dev server.                       |
| `npm run build`     | Type-check, then build static files to `dist/`.  |
| `npm run preview`   | Serve the production build locally.              |
| `npm run typecheck` | Type-check without emitting.                     |

## Deploying

`npm run build` produces static files in `dist/`. Deploy that directory to any
free static host with a CDN — Cloudflare Pages, Netlify, Vercel, or GitHub
Pages (guidelines section 3). Set the env vars in the host's build settings.

## Project layout

```
src/
  api/flights.ts          fetch wrapper for GET /flights
  types/flight.ts         FlightRecord shape
  components/
    SearchForm.tsx        callsign + optional time inputs
    FlightList.tsx        results list / empty state
    FlightCard.tsx        one flight record
  App.tsx                 search state + layout
  main.tsx                React entry point
  index.css               all styles
```

## Notes

- The app icon is a placeholder SVG (`public/icon.svg`). Drop in PNG icons for
  the best iOS home-screen experience.
- The flight record schema is owned by the backend and not pinned by the
  guidelines, so `FlightRecord` treats every field except `callsign` /
  `timestamp` as optional; the card renders whatever the API returns.
