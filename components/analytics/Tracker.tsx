'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// Persist session ID for the browser tab lifetime
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = sessionStorage.getItem('cr_sid');
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('cr_sid', id);
  }
  return id;
}

export function Tracker() {
  const pathname = usePathname() ?? '';
  const lastPath = useRef('');

  useEffect(() => {
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;

    const sessionId = getSessionId();
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: pathname,
        sessionId,
        referrer: document.referrer || undefined,
      }),
      // Fire and forget — don't block navigation
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  // Heartbeat every 2 min to keep session active
  useEffect(() => {
    const sessionId = getSessionId();
    const interval = setInterval(() => {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: pathname, sessionId }),
        keepalive: true,
      }).catch(() => {});
    }, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [pathname]);

  return null;
}
