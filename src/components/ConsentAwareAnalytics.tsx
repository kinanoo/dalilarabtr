'use client';

import { lazy, Suspense, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ANALYTICS_CONSENT_EVENT, getAnalyticsConsent } from '@/lib/consent';

const GoogleAnalytics = lazy(() => import('@/components/GoogleAnalytics').then((module) => ({ default: module.GoogleAnalytics })));
const WebVitals = lazy(() => import('@/components/WebVitals').then((module) => ({ default: module.WebVitals })));
const AnalyticsTracker = lazy(() => import('@/components/analytics/AnalyticsTracker').then((module) => ({ default: module.AnalyticsTracker })));
const ConversionEvents = lazy(() => import('@/components/analytics/ConversionEvents').then((module) => ({ default: module.ConversionEvents })));

/**
 * Two-tier analytics, split by what each tier actually needs:
 *
 * 1. FIRST-PARTY AGGREGATE COUNTING (/api/track → our own analytics_events)
 *    runs for EVERYONE. Without consent it runs in ANONYMOUS mode: no cookies,
 *    no localStorage IDs, no persistent identifier of any kind — just "a page
 *    was viewed / a session lasted N seconds" plus aggregate device/browser
 *    dimensions. Uniques come from the server's ip_hash, which is salted and
 *    ROTATES DAILY, so a visitor cannot be recognised across days. This is the
 *    cookieless model of Plausible/Cloudflare Analytics.
 *
 *    Why: when ALL counting was consent-gated (2026-07-14), the owner dashboard
 *    lost ~43% of visits overnight — most visitors never touch consent banners,
 *    so the site was flying blind while REAL traffic (Cloudflare requests,
 *    article view counters) was unchanged.
 *
 * 2. IDENTIFYING ANALYTICS (Google Analytics + its cookies, cross-session
 *    visitor_id/session_id, WebVitals→GA, conversion events) stays STRICTLY
 *    behind explicit consent, exactly as the privacy hardening intended.
 */
export default function ConsentAwareAnalytics() {
    const pathname = usePathname();
    const [consented, setConsented] = useState(false);

    useEffect(() => {
        const sync = () => setConsented(getAnalyticsConsent() === 'granted');
        sync();

        window.addEventListener(ANALYTICS_CONSENT_EVENT, sync);
        window.addEventListener('storage', sync);
        return () => {
            window.removeEventListener(ANALYTICS_CONSENT_EVENT, sync);
            window.removeEventListener('storage', sync);
        };
    }, []);

    if (pathname.startsWith('/admin')) return null;

    return (
        <Suspense fallback={null}>
            {/* Tier 1 — always on; anonymous (no IDs) until consent flips it. */}
            <AnalyticsTracker anonymous={!consented} />

            {/* Tier 2 — consent required. */}
            {consented && (
                <>
                    <GoogleAnalytics />
                    <WebVitals />
                    <ConversionEvents />
                </>
            )}
        </Suspense>
    );
}
