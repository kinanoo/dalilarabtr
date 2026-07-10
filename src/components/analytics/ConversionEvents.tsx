'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';

/**
 * ConversionEvents — ONE global click listener that fires GA4 conversion
 * events for the whole site, so every WhatsApp button, official-source link,
 * PDF download, and city link is measured no matter which of the ~15
 * components rendered it. Non-click conversions (form submit, tool use, FAQ
 * search, push subscribe) call trackEvent() directly from their own handlers.
 *
 * Mounted once inside DeferredExtras. No UI. Never throws (analytics must
 * never break a click). Skips /admin.
 */

const OFFICIAL_HOST = /(^|\.)(gov\.tr|goc\.gov\.tr|nvi\.gov\.tr|sgk\.gov\.tr|turkiye\.gov\.tr|edevlet\.gov\.tr|mhrs\.gov\.tr|csgb\.gov\.tr|resmigazete\.gov\.tr)$/i;

export function ConversionEvents() {
  const pathname = usePathname();
  // Keep the latest pathname in a ref so we register the listener ONCE.
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const onClick = (e: MouseEvent) => {
      try {
        const target = e.target as HTMLElement | null;
        const a = target?.closest?.('a');
        if (!a) return;
        const href = a.getAttribute('href') || '';
        if (!href) return;

        const page = pathRef.current;
        if (page.startsWith('/admin')) return;

        // WhatsApp — the primary conversion.
        if (/wa\.me|api\.whatsapp\.com|whatsapp:\/\//i.test(href)) {
          trackEvent('click_whatsapp', 'conversion', page);
        } else if (/^https?:\/\//i.test(href)) {
          // Outbound official government source.
          try {
            const host = new URL(href, window.location.origin).hostname;
            if (OFFICIAL_HOST.test(host)) {
              trackEvent('click_official_link', 'engagement', host);
            }
          } catch { /* bad URL — ignore */ }
        } else if (href.startsWith('/city/')) {
          trackEvent('city_page_click', 'engagement', href);
        }

        // Any PDF (forms/templates) — a download intent.
        if (/\.pdf($|\?|#)/i.test(href)) {
          trackEvent('download_pdf', 'engagement', href);
        }
      } catch { /* analytics must never break a click */ }
    };

    // Capture phase so we still fire even if the link handler stops propagation.
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}
