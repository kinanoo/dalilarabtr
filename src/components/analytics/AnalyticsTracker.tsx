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
                },
            });
        };

        // Small delay to avoid double-logging in React StrictMode during development
        const timeout = setTimeout(logView, 800);
        return () => clearTimeout(timeout);
    }, [pathname, searchParams]);

    return null;
}
