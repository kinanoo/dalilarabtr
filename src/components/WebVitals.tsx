'use client';

import { useReportWebVitals } from 'next/web-vitals';

/**
 * Web Vitals — يرسل مقاييس الأداء الأساسية لـ Google Analytics
 * LCP, FID, CLS, FCP, TTFB, INP
 */
export function WebVitals() {
    useReportWebVitals((metric) => {
        // Send to Google Analytics if available
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', metric.name, {
                event_category: 'Web Vitals',
                event_label: metric.id,
                value: String(Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value)),
                non_interaction: 'true',
            });
        }
    });

    return null;
}
