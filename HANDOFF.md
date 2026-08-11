# Handoff — SriLankan Airlines demo / Creatio CDP capture

Context for continuing this work in a new session. Paste this whole file (or
point Claude at it) to pick up where this one left off.

## What this project is

Vite + React 19 airline landing-page demo (hero, flight-search widget with a
mock results modal, destinations/offers sections, newsletter signup) that
captures visitors as Creatio Contacts and logs on-site activity as events,
wired directly into a Creatio CDP instance. Deployed to Vercel per
`vercel.json`. Creatio instance: `https://11012726-demo.creatio.com` (Cloud,
NET472 runtime).

This is a rebuild of an earlier Next.js version of the same demo
(`henryand1/Aviation-Demo`, on disk locally at
`C:\Users\abelh\OneDrive\Documents\airline-creatio-demo\`) — same Creatio
instance and the same `CaptureService.cs` contract, ported to Vite/React
conventions since there's no Next.js server here anymore.

## Architecture (current)

**The browser calls Creatio directly** — there is no API layer of our own in
the write path, except one tiny token-exchange endpoint. Full flow:

```
Browser → GET /api/creatio-token (same-origin Vercel Function)
        → server/creatio-token.js exchanges CREATIO_PUBLIC_CLIENT_ID/SECRET
          for a bearer token via Creatio Identity Service (server-to-server,
          no CORS)
        → token returned to browser

Browser → POST https://<instance>/0/rest/CaptureService/Lead|Track
          Authorization: Bearer <token>          (cross-origin to Creatio)
        → creatio/CaptureService.cs (custom C# Configuration Web Service,
          deployed in Creatio — this repo's copy is reference/documentation,
          not what actually runs)
          handles CORS itself, upserts Contact, writes UsrWebActivity,
          backfills prior anonymous activity once identified
```

Same two load-bearing facts as the old repo (both confirmed against the real
Creatio Cloud instance, not assumptions):

1. **Anonymous access to a custom Configuration Web Service is rejected
   (401)** by default — solved by requiring a valid Bearer token on every
   call instead.
2. **Creatio's Identity Service (`/connect/token`) has no CORS headers** for
   arbitrary origins, so the browser cannot fetch a token directly from
   Creatio. Token minting stays server-side; the actual data-writing calls to
   `CaptureService.cs` go straight from browser to Creatio, because that
   endpoint is our own code and sets its own CORS headers.

### What's different from the Next.js version, and why

- **No Next.js API route** → the token endpoint is a Vercel Function,
  split into two files on purpose:
  - `server/creatio-token.js` — framework-agnostic core (`getPublicAccessToken()`),
    no Vercel-specific APIs.
  - `api/creatio-token.js` — thin Vercel adapter that calls it and writes the
    HTTP response.
  **Why split this way:** Vercel is the real deploy target for now (this is a
  demo), but a future "real project" version of this may move to a plain
  Node/Express server instead. Moving later means adding one small Express
  route that imports `getPublicAccessToken()` from `server/creatio-token.js`
  and also serves the Vite `dist/` build as static files — `server/creatio-token.js`
  itself doesn't change, and neither does the frontend (`src/lib/creatio.js`
  just calls `/api/creatio-token`, same-origin, regardless of what serves it).
- **No Next.js middleware** → a static Vite SPA has no per-request server
  hook to set a cookie before first paint. The `aviodemo_session` cookie is
  now generated client-side on first read instead of server-issued
  (`src/lib/creatio.js`'s `getSessionId()`: `crypto.randomUUID()`, written via
  `document.cookie`, non-HttpOnly, 1yr, `SameSite=Lax`). This is a
  simplification, not a security regression — the session id was already
  untrusted by design (see "Decisions already made" below).
- **No Next.js router** → PageView tracking is a single mount-time call
  instead of watching route changes, since this app has one route.
- Everything else (token caching, `submitLead`, `track()`'s queue + 2500ms
  debounce flush, flush-on-tab-hide, `[data-track]` click delegation) is a
  direct logic port, just de-Next-ified (no `"use client"`/`"server-only"`,
  `NEXT_PUBLIC_*` → `VITE_*` via `import.meta.env`).

## Confirmed Creatio contract (from the deployed `CaptureService.cs` and the
Postman collection in this repo — not guessed)

- `GET {base}/0/rest/CaptureService/Ping` → `{"status":"accepted"}`
- `POST {base}/0/rest/CaptureService/Lead` — body
  `{ Email, FirstName, LastName, Phone, SessionId, PageUrl }` →
  `{ Success, ContactId, Error }`. `Email` is required; everything else optional.
- `POST {base}/0/rest/CaptureService/Track` — body
  `{ SessionId, Events: [{ EventType, PageUrl, Data (JSON-stringified string, not nested object), ContactId }] }` →
  `{ Success, Inserted, Error }`
- Token: `POST {identity_url}/connect/token`, form-urlencoded
  `grant_type=client_credentials&client_id=...&client_secret=...` →
  `{ access_token, expires_in }`

## Current status

- **Frontend wiring: implemented.** Newsletter form (`src/components/NewsletterSignup.jsx`,
  mounted in `Footer.jsx`) calls `submitLead`. `BookingWidget.jsx`'s "Search
  Flights" fires a `FlightSearch` track event; `SearchResultsModal.jsx`'s
  "Select Flight" fires a `FlightSelect` track event. `TrackerProvider.jsx`
  (wrapping `App`) fires `PageView` on mount and handles `[data-track]` click
  delegation.
- **No real checkout form yet** — unlike the old repo's `CheckoutForm.tsx`
  (name/email/phone fields, then `submitLead` + `BookingConfirmed` track
  event), "Select Flight" here just shows a mock `alert()` and logs an
  anonymous track event. Building a real checkout flow with its own lead
  capture is a separate, bigger feature, not part of this port.
- **Creatio side: assumed already deployed and working** (per session — the
  instance and `CaptureService.cs` carried over from the old repo,
  unmodified in behavior). **Not yet re-verified against this specific repo's
  requests** — the CORS allowlist step below has not been done, so browser
  calls from this app will fail until it is.
- **Not yet tested end-to-end** — `npm run build` has been run, but no one
  has exercised the full round trip (`vercel dev` → newsletter submit →
  Contact appears in Creatio) yet.

## Manual step required before anything works end-to-end

`creatio/CaptureService.cs`'s `AllowedOrigins` array (deployed in Creatio,
edited in Creatio Studio, then recompiled) needs this repo's origins added.
It currently only has the old Next.js app's origins
(`http://localhost:3000`, `https://aviation-demo-five.vercel.app`). This
repo's copy of the file (`creatio/CaptureService.cs`) already includes
`http://localhost:5173` (Vite's default dev port) as a documentation
reference, but **that local file is not what's running in Creatio** — the
actual deployed service still needs to be edited and recompiled by hand.
This repo's real Vercel production domain also needs to be added there once
it's known (not yet, since this hasn't been deployed to Vercel under a
confirmed domain in this session).

## Files touched this session (porting from Next.js)

New:
- `server/creatio-token.js` — portable token-exchange core
- `api/creatio-token.js` — thin Vercel Function adapter
- `src/lib/creatio.js` — client tracker/lead module (port of `lib/tracker.ts` + the client parts of `lib/creatio.ts`)
- `src/components/TrackerProvider.jsx` — PageView + `[data-track]` click delegation
- `src/components/NewsletterSignup.jsx` — extracted from inline Footer markup
- `.env.example`
- `creatio/CaptureService.cs`, `postman/AvioDemo-Creatio.postman_collection.json` — copied in as reference/documentation

Modified:
- `src/components/Footer.jsx` — newsletter markup replaced with `<NewsletterSignup />`
- `src/components/BookingWidget.jsx` — `track("FlightSearch", ...)` on search
- `src/components/SearchResultsModal.jsx` — `track("FlightSelect", ...)` on select
- `src/App.jsx` — wrapped in `<TrackerProvider>`

## Decisions already made (carried over from the old repo, don't re-litigate
unless the user raises it)

- **A credential lives in public browser code, on purpose.** The bearer
  token is real and usable by anyone reading the Network tab until it
  expires. Mitigations: a dedicated, narrowly-scoped OAuth app (Contact +
  UsrWebActivity only) and an in-memory rate limiter inside
  `CaptureService.cs`.
- **Session cookie is not HttpOnly, and is now client-generated instead of
  server-issued.** A spoofed session id only fabricates anonymous activity;
  it grants no access to anything.
- **`navigator.sendBeacon` is not used** for the tracking flush — it can't
  carry the `Authorization` header a direct Creatio call needs, so `flush()`
  in `src/lib/creatio.js` is `fetch`-only. A batch queued right as a tab
  closes can be lost; accepted as a demo-grade trade-off.
- **`CaptureService.cs`'s `AllowedOrigins` is an exact-match allowlist** — no
  wildcards. Vercel preview deployments get a different URL per deploy and
  won't match — not handled, a known limitation.

## Immediate next steps (in order)

1. Get the actual deployed `CaptureService.cs` in Creatio updated with this
   repo's origins (see "Manual step required" above) and recompiled.
2. Confirm the dedicated scoped OAuth 2.0 Integrated Application in Creatio
   (Contact + UsrWebActivity access only) still exists and its credentials
   are what `CREATIO_PUBLIC_CLIENT_ID`/`CREATIO_PUBLIC_CLIENT_SECRET` should
   point to.
3. Fill in `.env.local` from `.env.example`.
4. Run the copied Postman collection (`postman/AvioDemo-Creatio.postman_collection.json`)
   — Ping first, to confirm the Creatio side is healthy independent of the frontend.
5. `vercel dev` (not `npm run dev` — that won't serve `/api/creatio-token`),
   test the newsletter form and flight search/select flow from a real
   browser, watch the Network tab for CORS/auth errors on
   `CaptureService/Lead|Track`.
6. Once local works: set the same env vars in Vercel, redeploy, retest on
   the production domain, then add that domain to `AllowedOrigins` in Creatio.
7. Commit — nothing from this session has been committed yet; only do so
   when the user explicitly asks, per this repo's usual rule.

## Reference docs

- `README.md` — setup steps, env vars, local dev (`npm run dev` vs `vercel dev`)
- `creatio/CaptureService.cs` — reference copy of the deployed C# service, inline comments explain CORS/rate-limit reasoning
- `postman/AvioDemo-Creatio.postman_collection.json` — token + Ping/Lead/Track test requests against the real instance
