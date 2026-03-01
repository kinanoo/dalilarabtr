'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function getOrCreate(key: string, storage: Storage): string {
    let val = storage.getItem(key);
    if (!val) {
        val = (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : Math.random().toString(36).substring(2) + Date.now().toString(36);
        storage.setItem(key, val);
    }
    return val;
}

// ─── Device Detection Helpers ────────────────────────────────────────────────

function getDeviceType(): string {
    const w = window.screen.width;
    if (w <= 768) return 'mobile';
    if (w <= 1024) return 'tablet';
    return 'desktop';
}

function getBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Edg/')) return 'Edge';
    if (ua.includes('OPR/') || ua.includes('Opera')) return 'Opera';
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    return 'Other';
}

function getOS(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Android')) return 'Android';
    if (/iPad|iPhone|iPod/.test(ua)) return 'iOS';
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac OS')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('CrOS')) return 'ChromeOS';
    return 'Other';
}

// ─── Send event to server API (enriches with IP + geo) ──────────────────────

async function trackEvent(payload: Record<string, any>) {
    try {
        await fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true, // Ensures request completes even if page unloads
        });
    } catch {
        // Silent fail — analytics should never block user experience
    }
}

export function AnalyticsTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const sessionStartRef = useRef<number>(0);
    const visitorIdRef = useRef<string>('');
    const sessionIdRef = useRef<string>('');

    // ─── Initialize IDs + Session Duration Tracking ──────────────────────────
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Stable visitor ID (persists across sessions in localStorage)
        visitorIdRef.current = getOrCreate('visitor_id', localStorage);

        // Session ID (resets when tab/browser is closed, uses sessionStorage)
        sessionIdRef.current = getOrCreate('session_id', sessionStorage);

        // Track when this session started
        const storedStart = sessionStorage.getItem('session_start');
        if (!storedStart) {
            sessionStartRef.current = Date.now();
            sessionStorage.setItem('session_start', String(sessionStartRef.current));
        } else {
            sessionStartRef.current = parseInt(storedStart);
        }

        const sendSessionEnd = () => {
            // Skip admin pages — don't track admin activity
            if (window.location.pathname.startsWith('/admin')) return;

            const duration = Math.round((Date.now() - sessionStartRef.current) / 1000);
            // Ignore very short bounces (< 5s) and impossibly long sessions (> 2h)
            if (duration < 5 || duration > 7200) return;

            trackEvent({
                event_name: 'session_end',
                visitor_id: visitorIdRef.current,
                session_id: sessionIdRef.current,
                duration_seconds: duration,
                page_path: window.location.pathname,
            });

            // Reset the session timer for the next active period
            sessionStartRef.current = Date.now();
            sessionStorage.setItem('session_start', String(sessionStartRef.current));
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                sendSessionEnd();
            } else {
                // User came back to the tab: reset start time
                sessionStartRef.current = Date.now();
                sessionStorage.setItem('session_start', String(sessionStartRef.current));
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // ─── Track Page Views on Route Change ───────────────────────────────────
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const visitorId = visitorIdRef.current || localStorage.getItem('visitor_id') || '';
        const sessionId = sessionIdRef.current || sessionStorage.getItem('session_id') || '';

        // Skip admin pages — don't track admin activity
        if (pathname.startsWith('/admin')) return;

        // Small delay to avoid double-logging in React StrictMode during development
        const timeout = setTimeout(() => {
            trackEvent({
                event_name: 'page_view',
                page_path: pathname,
                visitor_id: visitorId,
                session_id: sessionId,
                meta: {
                    query: searchParams.toString() || undefined,
                    referrer: document.referrer || undefined,
                    screen: `${window.screen.width}x${window.screen.height}`,
                    device: getDeviceType(),
                    browser: getBrowser(),
                    os: getOS(),
                    language: navigator.language?.split('-')[0] || undefined,
                },
            });
        }, 800);

        return () => clearTimeout(timeout);
    }, [pathname, searchParams]);

    return null;
}
