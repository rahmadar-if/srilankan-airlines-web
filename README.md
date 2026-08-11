# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## Creatio CDP Integration

This app captures visitors as Creatio Contacts and logs on-site activity
(page views, flight search, flight select, newsletter signup) directly into
a Creatio CDP instance. Full architecture, decisions, and status are in
[HANDOFF.md](./HANDOFF.md) — read that first if you're picking this up.

**Env vars** — copy `.env.example` to `.env.local` and fill in:
- `VITE_CREATIO_BASE_URL` — public, your Creatio instance URL
- `CREATIO_BASE_URL` — server-side, same value (used to derive the Identity
  Service URL unless `CREATIO_IDENTITY_URL` is set explicitly)
- `CREATIO_PUBLIC_CLIENT_ID` / `CREATIO_PUBLIC_CLIENT_SECRET` — a dedicated,
  narrowly-scoped OAuth 2.0 Integrated Application in Creatio (Contact +
  UsrWebActivity access only)

**Local dev:**
- `npm run dev` — plain Vite, frontend-only. `/api/creatio-token` isn't
  served, so Creatio calls fail gracefully (caught, not thrown into the UI) —
  fine for UI work.
- `vercel dev` — serves the Vite app **and** `api/creatio-token.js` together,
  reading `.env.local`. Needed to exercise the real Creatio round trip
  locally (requires the Vercel CLI and the project linked with `vercel link`).

**Before it will work against a live Creatio instance:** the deployed
`CaptureService.cs`'s `AllowedOrigins` allowlist must include this app's
origin(s) (`http://localhost:5173` for dev, plus the production Vercel
domain) — see `HANDOFF.md` for details. This is a manual edit + recompile in
Creatio, not something this repo can change on its own.
