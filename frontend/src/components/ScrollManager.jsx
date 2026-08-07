import { useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const SCROLL_KEY_PREFIX = 'scrollPosition:';

function getKey(location) {
  // location.key is unique per history entry, preventing position bleed across visits
  return SCROLL_KEY_PREFIX + (location.key || location.pathname);
}

export default function ScrollManager() {
  const location = useLocation();
  const navigationType = useNavigationType(); // 'PUSH' | 'POP' | 'REPLACE'

  // Disable browser's own scroll restoration — we control it manually
  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    return () => {
      if ('scrollRestoration' in window.history) {
        try { window.history.scrollRestoration = 'auto'; } catch {}
      }
    };
  }, []);

  // Save the scroll position for the current location just before leaving it
  useLayoutEffect(() => {
    return () => {
      try {
        sessionStorage.setItem(getKey(location), String(window.scrollY || 0));
      } catch {}
    };
  }, [location]);

  // Restore or reset scroll after each navigation completes
  useLayoutEffect(() => {
    try {
      if (navigationType === 'POP') {
        const stored = sessionStorage.getItem(getKey(location));
        window.scrollTo({ top: stored ? parseInt(stored, 10) : 0, left: 0, behavior: 'auto' });
      } else {
        // PUSH or REPLACE — always load new page at top
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }
    } catch {}
  }, [location.key, navigationType]);

  return null;
}
