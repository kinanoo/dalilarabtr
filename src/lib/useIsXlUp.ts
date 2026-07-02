'use client';

import { useState, useEffect } from 'react';

/**
 * True once the viewport is ≥ xl (1280px) — Tailwind's `xl` breakpoint.
 *
 * Used to MOUNT a component in exactly one place across the responsive
 * layout. CSS `xl:hidden` only *hides* a node — it still mounts, runs
 * effects, and opens realtime subscriptions. When the same widget lives in
 * both the mobile header and the desktop sidebar, that means two live copies.
 * Gating each mount site on this hook (`!isXl` vs `isXl`) guarantees a single
 * instance.
 *
 * SSR-safe: starts `false` (mobile-first) and resolves on mount, so the
 * server and first client render agree.
 */
export function useIsXlUp(): boolean {
    const [isXl, setIsXl] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1280px)');
        const sync = () => setIsXl(mq.matches);
        sync();
        mq.addEventListener('change', sync);
        return () => mq.removeEventListener('change', sync);
    }, []);

    return isXl;
}
