'use client';

import { useEffect, useState, type ReactNode } from 'react';

/**
 * Delays rendering of children until the browser is idle (or after 2.5s fallback).
 * Use this to wrap non-critical, invisible components so they don't block initial render.
 */
export default function LazyGroup({ children }: { children: ReactNode }) {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if ('requestIdleCallback' in window) {
            // A permanently busy mobile browser may never have an idle slot.
            // The timeout keeps non-critical controls (consent, accessibility
            // helpers and recovery UI) available without joining first paint.
            const id = (window as any).requestIdleCallback(() => setReady(true), { timeout: 2500 });
            return () => (window as any).cancelIdleCallback(id);
        }
        const t = setTimeout(() => setReady(true), 2500);
        return () => clearTimeout(t);
    }, []);

    if (!ready) return null;
    return <>{children}</>;
}
