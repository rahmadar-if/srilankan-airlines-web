// Thin wrapper around window.dataLayer for pushing custom events to Google
// Tag Manager (see index.html for the container snippet). Kept separate from
// src/lib/creatio.js on purpose — GTM/GA4 is marketing analytics, the
// Creatio calls are CRM/lead capture; they happen to fire at the same UI
// moments but are unrelated systems with unrelated failure modes.
//
// No manual page_view push here: this app is a single route with no
// client-side navigation, so GTM's own container-load trigger already
// covers the one page view. That's only true as long as this stays a
// single-page app — add a router later and this needs a page_view push per
// route change (see HANDOFF.md's note on TrackerProvider for the same
// caveat on the Creatio side).
export function pushToDataLayer(event, data) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...data });
}
