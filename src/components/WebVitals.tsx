'use client';

import { useReportWebVitals } from 'next/web-vitals';

/**
 * WebVitals — first-party Core Web Vitals collection.
 *
 * These are ANONYMOUS PERFORMANCE NUMBERS about the site itself (how fast a page
 * painted, how much it shifted, how fast it responded) — not a person, not a
 * profile, not an identifier. Nothing is stored on the visitor's device and no
 * visitor/session id is attached. So this runs for EVERY visitor, independent of
 * the analytics-consent switch: the owner cannot improve what he cannot measure,
 * and consent-gating it hid the performance of exactly the low-end / slow-network
 * users who need the improvement most.
 * (Google Analytics stays consent-gated — see ConsentAwareAnalytics.)
 *
 * One row per page view, not one per metric: metrics arrive at different times
 * (TTFB/FCP early; LCP, CLS and INP only finalise when the page is hidden), so
 * they're buffered and flushed ONCE on pagehide via sendBeacon — which survives
 * the page being closed, unlike a normal fetch.
 */

type Buffered = Record<string, number>;

export function WebVitals() {
    useReportWebVitals((metric) => {
        if (typeof window === 'undefined') return;

        const w = window as unknown as {
            __vitals?: Buffered;
            __vitalsFlush?: boolean;
            gtag?: (...args: unknown[]) => void;
        };

        // CLS is a unitless score (0-1) — keep 3 decimals. Everything else is ms.
        const buf = (w.__vitals ||= {});
        buf[metric.name.toLowerCase()] =
            metric.name === 'CLS' ? Math.round(metric.value * 1000) / 1000 : Math.round(metric.value);

        // Google Analytics — only ever present when the visitor consented, so
        // this line is naturally consent-gated without an extra check.
        w.gtag?.('event', metric.name, {
            event_category: 'Web Vitals',
            event_label: metric.id,
            value: String(Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value)),
            non_interaction: 'true',
        });

        // Register the one-shot flush the first time any metric lands.
        if (w.__vitalsFlush) return;
        w.__vitalsFlush = true;

        const flush = () => {
            const metrics = w.__vitals;
            if (!metrics || Object.keys(metrics).length === 0) return;
            w.__vitals = {}; // never send the same page view twice

            // Device + network context — this is what makes the numbers
            // actionable ("slow only on 3G / low-core Android", not just "slow").
            const nav = navigator as Navigator & {
                connection?: { effectiveType?: string; saveData?: boolean };
                deviceMemory?: number;
                hardwareConcurrency?: number;
            };

            const payload = JSON.stringify({
                event_name: 'web_vital',
                page_path: window.location.pathname,
                // Explicitly no visitor_id / session_id: performance data needs
                // no identity. The server strips them anyway when unconsented.
                analytics_consent: false,
                meta: {
                    ...metrics,
                    conn: nav.connection?.effectiveType,
                    save_data: nav.connection?.saveData || undefined,
                    mem: nav.deviceMemory,
                    cores: nav.hardwareConcurrency,
                    viewport_w: window.innerWidth,
                },
            });

            try {
                // sendBeacon survives page unload; fetch+keepalive is the fallback.
                if (!navigator.sendBeacon?.('/api/track', new Blob([payload], { type: 'application/json' }))) {
                    void fetch('/api/track', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: payload,
                        keepalive: true,
                    }).catch(() => { });
                }
            } catch { /* never let measurement break the page */ }
        };

        // 'pagehide' fires on bfcache navigations and real unloads; the
        // visibilitychange guard covers mobile tab-switch / app-switch, which is
        // how most phone sessions actually end.
        window.addEventListener('pagehide', flush, { once: true });
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') flush();
        });
    });

    return null;
}
