'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  RECENT_ACTIVITY_EVENT,
  RECENT_ACTIVITY_KEY,
  addRecentActivity,
  classifyRecentPath,
  parseRecentActivity,
} from '@/lib/recentActivity';

export default function RecentActivityTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!classifyRecentPath(pathname)) return;

    // Metadata can settle just after a client-side route transition. Waiting
    // briefly prevents saving the previous page title with the new path.
    const timer = window.setTimeout(() => {
      try {
        const current = parseRecentActivity(localStorage.getItem(RECENT_ACTIVITY_KEY));
        const next = addRecentActivity(current, {
          path: pathname,
          title: document.title,
          visitedAt: Date.now(),
        });
        localStorage.setItem(RECENT_ACTIVITY_KEY, JSON.stringify(next));
        window.dispatchEvent(new Event(RECENT_ACTIVITY_EVENT));
      } catch {
        // Private browsing and locked-down browsers may disable localStorage.
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}
