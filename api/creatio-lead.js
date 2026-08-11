// Same-origin endpoint the browser calls (see src/lib/creatio.js's
// submitLead()). Relays to Creatio's CaptureService.Lead server-to-server —
// the browser never sees the Creatio bearer token or base URL.
import { callCaptureService } from '../server/capture-service.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ Success: false, Error: 'Method not allowed' });
    return;
  }
  try {
    const { status, data } = await callCaptureService('Lead', req.body);
    res.status(status).json(data);
  } catch (err) {
    console.error('[/api/creatio-lead]', err);
    res.status(502).json({ Success: false, Error: err?.message || 'Unknown error' });
  }
}
