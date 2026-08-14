// Bridges SearchResultsModal's in-progress checkout across the
// /login and /register route change — those are separate pages, so
// navigating there unmounts the modal and would otherwise lose the
// selected flight, passenger details, add-ons, and booking_attempt_id.
// sessionStorage (not localStorage) on purpose: this is a one-shot resume
// for the current tab's checkout attempt, not something that should
// persist/leak across browser sessions.
const RESUME_KEY = 'aviodemo_resume_checkout';

export function saveCheckoutState(state) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(RESUME_KEY, JSON.stringify(state));
}

export function getCheckoutState() {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(RESUME_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearCheckoutState() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(RESUME_KEY);
}
