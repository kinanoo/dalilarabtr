'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export function AnalyticsTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        // 1. Get or Create Visitor ID
        let visitorId = localStorage.getItem('visitor_id');
        if (!visitorId) {
            visitorId = (typeof crypto !== 'undefined' && crypto.randomUUID)
                ? crypto.randomUUID()
                : Math.random().toString(36).substring(2) + Date.now().toString(36);
            localStorage.setItem('visitor_id', visitorId);
        }

        // 2. Log Page View
        const logView = async () => {
            if (!supabase) return;

            await supabase.from('analytics_events').insert({
                event_name: 'page_view',
                page_path: pathname,
                visitor_id: visitorId,
                meta: {
                    query: searchParams.toString(),
                    referrer: document.referrer,
                    screen: `${window.screen.width}x${window.screen.height}`
                }
            });
        };

        // Debounce slightly to avoid double logs in strict mode dev (optional, but good practice)
        const timeout = setTimeout(logView, 1000);

        return () => clearTimeout(timeout);
    }, [pathname, searchParams]);

    return null; // Invisible component
}
