// Thin wrapper around window.dataLayer for pushing custom events to Google
// Tag Manager (see index.html for the container snippet). This is the only
// thing React does for Creatio delivery too — GTM Custom HTML tags read
// these same dataLayer events and forward to /api/creatio-lead|track
// server-to-server. See HANDOFF.md's GTM setup section for the tag configs.
//
// No manual page_view push here — GTM's own container-load trigger already
// covers it. Since react-router-dom was added (see main.jsx), routes now
// change client-side without a full reload; if page_view-per-route ever
// matters, add a push here on route change (e.g. via useLocation()).
export function pushToDataLayer(event, data) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...data });
}

const IDENTIFIED_EMAIL_KEY = 'aviodemo_identified_email';

// A React-owned "are we identified" flag, separate on purpose from
// localStorage's aviodemo_contact_id (which only a GTM tag sets, after a
// round trip through Creatio — see HANDOFF.md). Gating UI on the GTM-set
// value would mean the gate silently breaks if a tag isn't published yet;
// this one is set directly by Register/Login the moment they submit, so the
// "must be identified before Payment" gate in SearchResultsModal.jsx works
// regardless of GTM config state. It does NOT mean Creatio actually has a
// Contact for this email yet — that still depends on the GTM tag/proxy
// working, same as before.
export function setIdentifiedEmail(email) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(IDENTIFIED_EMAIL_KEY, email);
}

export function getIdentifiedEmail() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(IDENTIFIED_EMAIL_KEY);
}
