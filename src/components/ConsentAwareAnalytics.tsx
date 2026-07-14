'use client';

import { lazy, Suspense, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ANALYTICS_CONSENT_EVENT, getAnalyticsConsent } from '@/lib/consent';

const GoogleAnalytics = lazy(() => import('@/components/GoogleAnalytics').then((module) => ({ default: module.GoogleAnalytics })));
const WebVitals = lazy(() => import('@/components/WebVitals').then((module) => ({ default: module.WebVitals })));
const AnalyticsTracker = lazy(() => import('@/components/analytics/AnalyticsTracker').then((module) => ({ default: module.AnalyticsTracker })));
const ConversionEvents = lazy(() => import('@/components/analytics/ConversionEvents').then((module) => ({ default: module.ConversionEvents })));

export default function ConsentAwareAnalytics() {
    const pathname = usePathname();
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        const sync = () => setEnabled(getAnalyticsConsent() === 'granted');
        sync();

        window.addEventListener(ANALYTICS_CONSENT_EVENT, sync);
        window.addEventListener('storage', sync);
        return () => {
            window.removeEventListener(ANALYTICS_CONSENT_EVENT, sync);
            window.removeEventListener('storage', sync);
        };
    }, []);

    if (!enabled || pathname.startsWith('/admin')) return null;

    return (
        <Suspense fallback={null}>
            <GoogleAnalytics />
            <WebVitals />
            <AnalyticsTracker />
            <ConversionEvents />
        </Suspense>
    );
}
