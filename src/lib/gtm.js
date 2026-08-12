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
