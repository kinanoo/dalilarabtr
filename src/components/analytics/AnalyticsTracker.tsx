'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { BREAKPOINTS } from '@/lib/breakpoints';

// ─── Two modes (see ConsentAwareAnalytics for the policy) ────────────────────
//
// anonymous=false (visitor granted consent):
//   full mode — stable visitor_id (localStorage) + session_id (sessionStorage)
//   are generated and attached, so returning-visitor stats work.
//
// anonymous=true (no consent yet / denied):
//   cookieless aggregate mode — NO identifier is created or read on the
//   device: no visitor_id, no session_id, nothing written to storage. Events
//   still count ("a page was viewed", "a session lasted N seconds") with
//   aggregate dimensions (device/browser/os/screen/referrer/language).
//   Server-side uniqueness uses the daily-rotating salted ip_hash, so a
//   visitor cannot be recognised across days. The `analytics_consent` flag is
//   sent truthfully; the server strips any identifiers on non-consented
//   events as defense in depth.

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
    if (w <= BREAKPOINTS.md) return 'mobile';
    if (w <= BREAKPOINTS.lg) return 'tablet';
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

async function sendEvent(payload: Record<string, any>, consented: boolean) {
    try {
        await fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, analytics_consent: consented }),
            keepalive: true, // Ensures request completes even if page unloads
        });
    } catch {
        // Silent fail — analytics should never block user experience
    }
}

export function AnalyticsTracker({ anonymous = false }: { anonymous?: boolean }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const sessionStartRef = useRef<number>(0);
    const visitorIdRef = useRef<string>('');
    const sessionIdRef = useRef<string>('');

    // ─── Initialize IDs + Session Duration Tracking ──────────────────────────
    useEffect(() => {
        if (typeof window === 'undefined') return;

        if (!anonymous) {
            // Stable visitor ID (persists across sessions in localStorage)
            visitorIdRef.current = getOrCreate('visitor_id', localStorage);
            // Session ID (resets when tab/browser is closed, uses sessionStorage)
            sessionIdRef.current = getOrCreate('session_id', sessionStorage);
        } else {
            // Anonymous mode: no identifiers, and nothing written to storage.
            visitorIdRef.current = '';
            sessionIdRef.current = '';
        }

        // Session start: in-memory only for anonymous visitors (a timestamp in
        // sessionStorage is not an identifier, but keeping storage untouched
        // makes "nothing is stored on your device" literally true).
        if (!anonymous) {
            const storedStart = sessionStorage.getItem('session_start');
            if (!storedStart) {
                sessionStartRef.current = Date.now();
                sessionStorage.setItem('session_start', String(sessionStartRef.current));
            } else {
                sessionStartRef.current = parseInt(storedStart);
            }
        } else {
            sessionStartRef.current = Date.now();
        }

        const sendSessionEnd = () => {
            // Skip admin pages — don't track admin activity
            if (window.location.pathname.startsWith('/admin')) return;

            const duration = Math.round((Date.now() - sessionStartRef.current) / 1000);
            // Ignore very short bounces (< 5s) and impossibly long sessions (> 2h)
            if (duration < 5 || duration > 7200) return;

            sendEvent({
                event_name: 'session_end',
                visitor_id: visitorIdRef.current || undefined,
                session_id: sessionIdRef.current || undefined,
                duration_seconds: duration,
                page_path: window.location.pathname,
            }, !anonymous);

            // Reset the session timer for the next active period
            sessionStartRef.current = Date.now();
            if (!anonymous) sessionStorage.setItem('session_start', String(sessionStartRef.current));
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                sendSessionEnd();
            } else {
                // User came back to the tab: reset start time
                sessionStartRef.current = Date.now();
                if (!anonymous) sessionStorage.setItem('session_start', String(sessionStartRef.current));
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [anonymous]);

    // ─── Track Page Views on Route Change ───────────────────────────────────
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const visitorId = anonymous ? '' : (visitorIdRef.current || localStorage.getItem('visitor_id') || '');
        const sessionId = anonymous ? '' : (sessionIdRef.current || sessionStorage.getItem('session_id') || '');

        // Skip admin pages — don't track admin activity
        if (pathname.startsWith('/admin')) return;

        // Small delay to avoid double-logging in React StrictMode during development
        const timeout = setTimeout(() => {
            sendEvent({
                event_name: 'page_view',
                page_path: pathname,
                visitor_id: visitorId || undefined,
                session_id: sessionId || undefined,
                meta: {
                    query: searchParams.toString() || undefined,
                    referrer: document.referrer || undefined,
                    screen: `${window.screen.width}x${window.screen.height}`,
                    device: getDeviceType(),
                    browser: getBrowser(),
                    os: getOS(),
                    language: navigator.language?.split('-')[0] || undefined,
                },
            }, !anonymous);
        }, 800);

        return () => clearTimeout(timeout);
    }, [pathname, searchParams, anonymous]);

    return null;
}
