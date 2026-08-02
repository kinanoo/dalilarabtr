'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Puts a NEW page at the top — and leaves every other navigation alone.
 *
 * This used to call `window.scrollTo(0, 0)` on every pathname change, full
 * stop. Passive effects run after the router has already done its own scroll
 * handling, so this was always the last writer, and it undid two things the
 * browser had got right:
 *
 *   • Back. Scroll a few screens into the article list, open one, press Back —
 *     and you landed at the top of the list again, hunting for where you were.
 *     That is the main way people browse this site on a phone.
 *   • Anchors. A link to another page's section scrolled to the section during
 *     commit, then got yanked back to the top a moment later.
 *
 * So: skip history traversals, skip anything carrying a hash. What is left is
 * a plain forward navigation, which is the only case the original was for.
 */
export default function ScrollRestoration() {
  const pathname = usePathname();
  const cameFromHistory = useRef(false);

  useEffect(() => {
    const onPopState = () => { cameFromHistory.current = true; };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (cameFromHistory.current) {
      // Back or Forward — the browser restored a position; don't touch it.
      cameFromHistory.current = false;
      return;
    }
    // Someone linked to a specific section; the router already scrolled there.
    if (window.location.hash) return;

    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
