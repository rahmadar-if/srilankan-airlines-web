import { useEffect } from 'react';
import { track } from '../lib/creatio';

/**
 * This app is a single route, so PageView just fires once on mount instead
 * of watching a router — the old Next.js version tracked route changes via
 * usePathname/useSearchParams, which don't apply here.
 */
export default function TrackerProvider({ children }) {
  useEffect(() => {
    track('PageView', { path: window.location.pathname + window.location.search });
  }, []);

  useEffect(() => {
    function handleClick(e) {
      const el = e.target?.closest?.('[data-track]');
      if (!el) return;
      const eventType = el.getAttribute('data-track') || 'Click';
      const label = el.getAttribute('data-track-label') || el.textContent?.trim().slice(0, 80) || '';
      track(eventType, { label });
    }
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  return children;
}
