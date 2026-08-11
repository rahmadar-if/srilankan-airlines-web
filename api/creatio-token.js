// Thin Vercel Function adapter — the only Vercel-specific file in this
// integration. Hands the browser a short-lived Creatio bearer token, never
// the client_secret itself, so the browser can call Creatio's CaptureService
// directly for everything else. Moving off Vercel later just means writing a
// different adapter (e.g. an Express route) around the same
// getPublicAccessToken() in ../server/creatio-token.js.
import { getPublicAccessToken } from '../server/creatio-token.js';

export default async function handler(req, res) {
  try {
    const { accessToken, expiresIn } = await getPublicAccessToken();
    res.status(200).json({ accessToken, expiresIn });
  } catch (err) {
    console.error('[/api/creatio-token]', err);
    res.status(502).json({ error: err?.message || 'Unknown error' });
  }
}
