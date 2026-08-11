// Framework-agnostic core — no Vercel-specific APIs, importable from any Node
// server. The only thing this module does is exchange the OAuth2
// client_credentials secret for a short-lived Creatio bearer token; that
// secret must never reach the browser. All Contact/activity business logic
// (upsert, activity logging, identity backfill) lives in Creatio's own
// CaptureService (see creatio/CaptureService.cs) and is called directly by
// the browser.

// Module-level cache. Survives repeated calls within the same warm process,
// but not across cold starts or across the multiple concurrent instances a
// serverless platform may spin up. Fine for a demo; for production traffic
// put the token in a shared cache (Redis/Upstash) keyed by client_id instead.
let cachedToken = null;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Copy .env.example to .env.local and fill it in.`
    );
  }
  return value;
}

function getIdentityUrl() {
  if (process.env.CREATIO_IDENTITY_URL) {
    return process.env.CREATIO_IDENTITY_URL.replace(/\/+$/, '');
  }
  // Cloud convention: https://<name>.creatio.com -> https://<name>-is.creatio.com
  // Confirmed convention for Creatio cloud, but if your instance uses a
  // custom domain this derivation will be wrong — set CREATIO_IDENTITY_URL
  // explicitly in that case.
  const base = new URL(requireEnv('CREATIO_BASE_URL').replace(/\/+$/, ''));
  const parts = base.hostname.split('.');
  parts[0] = `${parts[0]}-is`;
  base.hostname = parts.join('.');
  return base.origin;
}

async function fetchToken() {
  const identityUrl = getIdentityUrl();
  const clientId = requireEnv('CREATIO_PUBLIC_CLIENT_ID');
  const clientSecret = requireEnv('CREATIO_PUBLIC_CLIENT_SECRET');

  const res = await fetch(`${identityUrl}/connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `Creatio token request to ${identityUrl}/connect/token failed (${res.status}): ${text}`
    );
  }

  const data = await res.json();
  cachedToken = { accessToken: data.access_token, expiresIn: data.expires_in, fetchedAt: Date.now() };
  return cachedToken;
}

/**
 * Returns a valid Creatio bearer token, fetching a fresh one only when the
 * cached one is missing or within 60s of expiring. This is the token the
 * browser gets back from /api/creatio-token — the client_secret used to mint
 * it never leaves this function.
 */
export async function getPublicAccessToken() {
  if (cachedToken) {
    const ageSeconds = (Date.now() - cachedToken.fetchedAt) / 1000;
    if (ageSeconds < cachedToken.expiresIn - 60) {
      return cachedToken;
    }
  }
  return fetchToken();
}
