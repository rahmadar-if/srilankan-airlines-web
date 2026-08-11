const CONTACT_KEY = 'aviodemo_contact_id';
const SESSION_COOKIE = 'aviodemo_session';
const FLUSH_DELAY_MS = 2500;

// Public by design — this is Creatio's own domain, not a secret. The client
// needs it to call CaptureService directly.
const CREATIO_BASE_URL = import.meta.env.VITE_CREATIO_BASE_URL?.replace(/\/+$/, '');

export function getContactId() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(CONTACT_KEY);
}

export function setContactId(id) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CONTACT_KEY, id);
}

/**
 * Get-or-create the anonymous session id. A plain Vite SPA has no
 * per-request server hook to set this before first paint (unlike the old
 * Next.js middleware version), so it's generated client-side on first read
 * instead and persisted the same way: a non-HttpOnly cookie, 1 year,
 * SameSite=Lax. Not HttpOnly on purpose — this module reads it to attach to
 * every direct Creatio call. That trade-off is deliberate: a spoofed
 * sessionId only lets someone fabricate an anonymous activity trail, it
 * grants no access to anything.
 */
export function getSessionId() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${SESSION_COOKIE}=([^;]*)`));
  if (match) return decodeURIComponent(match[1]);

  const id = crypto.randomUUID();
  const oneYearSeconds = 60 * 60 * 24 * 365;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(id)}; path=/; max-age=${oneYearSeconds}; SameSite=Lax${secure}`;
  return id;
}

let cachedToken = null;
let tokenPromise = null;

/** Fetches (and caches) a Creatio bearer token via /api/creatio-token — the
 * one server-side call left in this app. Shared by track() and submitLead(). */
async function getCreatioToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }
  if (!tokenPromise) {
    tokenPromise = fetch('/api/creatio-token')
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok || !body.accessToken) {
          throw new Error(body.error || 'Could not get a Creatio access token.');
        }
        cachedToken = {
          value: body.accessToken,
          expiresAt: Date.now() + Math.max((body.expiresIn ?? 300) - 60, 30) * 1000,
        };
        return cachedToken.value;
      })
      .finally(() => {
        tokenPromise = null;
      });
  }
  return tokenPromise;
}

async function callCaptureService(method, body) {
  if (!CREATIO_BASE_URL) {
    throw new Error('VITE_CREATIO_BASE_URL is not set.');
  }
  const token = await getCreatioToken();
  const res = await fetch(`${CREATIO_BASE_URL}/0/rest/CaptureService/${method}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || data.Success === false) {
    throw new Error(data.Error || `CaptureService/${method} failed (${res.status}).`);
  }
  return data;
}

/** Creates/updates a Contact and logs LeadCaptured — called by NewsletterSignup
 * (and any future checkout form). Runs LeadCaptured + the identity backfill
 * inside Creatio's CaptureService.Lead, not here. */
export async function submitLead({ email, firstName, lastName, phone, pageUrl }) {
  const sessionId = getSessionId();
  if (!sessionId) {
    throw new Error('No session id yet — reload the page and try again.');
  }
  const result = await callCaptureService('Lead', {
    Email: email,
    FirstName: firstName,
    LastName: lastName,
    Phone: phone,
    SessionId: sessionId,
    PageUrl: pageUrl,
  });
  setContactId(result.ContactId);
  return { contactId: result.ContactId };
}

let queue = [];
let flushTimer = null;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(flush, FLUSH_DELAY_MS);
}

async function flush() {
  flushTimer = null;
  if (queue.length === 0) return;
  const events = queue;
  queue = [];

  const sessionId = getSessionId();
  if (!sessionId) return;

  try {
    // navigator.sendBeacon can't carry an Authorization header, so it's not
    // usable here — everything goes through fetch. That trades away
    // sendBeacon's tab-close delivery guarantee for the ability to
    // authenticate straight to Creatio; a batch queued right as the tab
    // closes can be lost. Acceptable for this demo.
    await callCaptureService('Track', {
      SessionId: sessionId,
      Events: events.map((e) => ({
        EventType: e.eventType,
        PageUrl: e.pageUrl,
        Data: e.data ? JSON.stringify(e.data).slice(0, 4000) : undefined,
        ContactId: e.contactId,
      })),
    });
  } catch (err) {
    console.error('track flush failed:', err);
  }
}

/** Queue a tracking event. Batches are sent automatically after a short delay. */
export function track(eventType, data) {
  if (typeof window === 'undefined') return;
  queue.push({
    contactId: getContactId() || undefined,
    eventType,
    pageUrl: window.location.pathname + window.location.search,
    data,
  });
  scheduleFlush();
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
}
