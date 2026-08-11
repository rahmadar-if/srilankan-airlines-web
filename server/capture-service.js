// Server-side proxy to Creatio's CaptureService — called by api/creatio-lead.js
// and api/creatio-track.js, never by the browser directly. This is what
// removes the CORS/IIS-OPTIONS problem entirely: the browser only ever talks
// to our own /api/* endpoints (same-origin), and this module is the one
// making the actual server-to-server call to Creatio, where CORS doesn't
// apply at all.
import { getPublicAccessToken } from './creatio-token.js';

const CREATIO_BASE_URL = process.env.CREATIO_BASE_URL?.replace(/\/+$/, '');

/**
 * POSTs to https://<instance>/0/rest/CaptureService/{method} with a fresh
 * bearer token. Returns the raw status + parsed body so callers can relay
 * Creatio's response (including its own error shape) straight back to the
 * browser without re-inventing it.
 */
export async function callCaptureService(method, body) {
  if (!CREATIO_BASE_URL) {
    throw new Error('CREATIO_BASE_URL is not set.');
  }
  const { accessToken } = await getPublicAccessToken();
  const res = await fetch(`${CREATIO_BASE_URL}/0/rest/CaptureService/${method}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
}
