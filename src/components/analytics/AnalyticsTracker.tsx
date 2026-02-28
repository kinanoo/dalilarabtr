'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

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

/** Map timezone to country name (Arabic-audience-focused) */
function getCountryFromTimezone(): string {
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const map: Record<string, string> = {
            // Turkey
            'Europe/Istanbul': 'Turkey',
            // Syria
            'Asia/Damascus': 'Syria',
            // Lebanon
            'Asia/Beirut': 'Lebanon',
            // Iraq
            'Asia/Baghdad': 'Iraq',
            // Jordan
            'Asia/Amman': 'Jordan',
            // Palestine
            'Asia/Hebron': 'Palestine', 'Asia/Gaza': 'Palestine',
            // Egypt
            'Africa/Cairo': 'Egypt',
            // Saudi Arabia
            'Asia/Riyadh': 'Saudi Arabia',
            // UAE
            'Asia/Dubai': 'UAE',
            // Kuwait
            'Asia/Kuwait': 'Kuwait',
            // Qatar
            'Asia/Qatar': 'Qatar',
            // Bahrain
            'Asia/Bahrain': 'Bahrain',
            // Oman
            'Asia/Muscat': 'Oman',
            // Yemen
            'Asia/Aden': 'Yemen',
            // Libya
            'Africa/Tripoli': 'Libya',
            // Tunisia
            'Africa/Tunis': 'Tunisia',
            // Algeria
            'Africa/Algiers': 'Algeria',
            // Morocco
            'Africa/Casablanca': 'Morocco',
            // Sudan
            'Africa/Khartoum': 'Sudan',
            // Germany
            'Europe/Berlin': 'Germany',
            // Netherlands
            'Europe/Amsterdam': 'Netherlands',
            // Sweden
            'Europe/Stockholm': 'Sweden',
            // France
            'Europe/Paris': 'France',
            // UK
            'Europe/London': 'UK',
            // US
            'America/New_York': 'USA', 'America/Chicago': 'USA',
            'America/Denver': 'USA', 'America/Los_Angeles': 'USA',
            // Canada
            'America/Toronto': 'Canada', 'America/Vancouver': 'Canada',
            // Austria
            'Europe/Vienna': 'Austria',
            // Belgium
            'Europe/Brussels': 'Belgium',
            // Denmark
            'Europe/Copenhagen': 'Denmark',
            // Norway
            'Europe/Oslo': 'Norway',
            // Finland
            'Europe/Helsinki': 'Finland',
            // Greece
            'Europe/Athens': 'Greece',
            // Italy
            'Europe/Rome': 'Italy',
            // Spain
            'Europe/Madrid': 'Spain',
            // Russia
            'Europe/Moscow': 'Russia',
        };
        return map[tz] || tz.split('/')[0] || 'Unknown';
    } catch {
        return 'Unknown';
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
        if (!supabase || typeof window === 'undefined') return;

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

        const sendSessionEnd = async () => {
            if (!supabase) return;
            const duration = Math.round((Date.now() - sessionStartRef.current) / 1000);
            // Ignore very short bounces (< 5s) and impossibly long sessions (> 2h)
            if (duration < 5 || duration > 7200) return;

            await supabase.from('analytics_events').insert({
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
        if (!supabase || typeof window === 'undefined') return;

        const visitorId = visitorIdRef.current || localStorage.getItem('visitor_id') || '';
        const sessionId = sessionIdRef.current || sessionStorage.getItem('session_id') || '';

        const logView = async () => {
            if (!supabase) return;
            await supabase.from('analytics_events').insert({
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
                    country: getCountryFromTimezone(),
                },
            });
        };

        // Small delay to avoid double-logging in React StrictMode during development
        const timeout = setTimeout(logView, 800);
        return () => clearTimeout(timeout);
    }, [pathname, searchParams]);

    return null;
}
