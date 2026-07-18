'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

/**
 * Idle-deferred PrayerPopover.
 *
 * The real popover (city selector, `usePrayerData` + its /api/prayer-times
 * fetch, the TURKEY_CITIES list, the full schedule panel) used to hydrate in
 * EVERY page's first load through the Navbar, and its data hook fired a network
 * request that competed with hydration. Mirror NotificationBellLazy: render a
 * pixel-identical static mosque button immediately, and only load/mount the
 * real component when the browser goes idle (or on first click). `ssr: false`
 * keeps the chunk + the prayer-times module out of the initial script set.
 */
const PrayerPopover = dynamic(() => import('./PrayerPopover'), {
    ssr: false,
    loading: () => <PrayerShell />,
});

function MosqueIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M12 1.5a1.2 1.2 0 0 1 .9 2 1.6 1.6 0 0 0 .1-2A1.2 1.2 0 0 1 12 1.5Z" />
            <rect x="2" y="8" width="2.5" height="12" rx="0.5" />
            <rect x="2.5" y="6" width="1.5" height="2" rx="0.5" />
            <circle cx="3.25" cy="5.5" r="0.6" />
            <path d="M6 14h12v6H6z" />
            <path d="M12 6c-4 0-6 4-6 8h12c0-4-2-8-6-8Z" />
            <rect x="19.5" y="8" width="2.5" height="12" rx="0.5" />
            <rect x="20" y="6" width="1.5" height="2" rx="0.5" />
            <circle cx="20.75" cy="5.5" r="0.6" />
            <path d="M10.5 16a1.5 1.5 0 0 1 3 0v4h-3z" fill="white" opacity="0.4" />
        </svg>
    );
}

// Static clone of PrayerPopover's resting trigger button (classes copied from
// PrayerPopover.tsx — keep in sync) so the swap is visually seamless.
function PrayerShell({ onClick }: { onClick?: () => void }) {
    return (
        <div className="relative">
            <button
                type="button"
                onClick={onClick}
                aria-label="مواقيت الصلاة"
                className="relative p-2 min-w-11 min-h-11 flex items-center justify-center text-white/90 hover:text-white hover:bg-white/15 rounded-lg transition-colors"
            >
                <MosqueIcon size={20} />
            </button>
        </div>
    );
}

export default function PrayerPopoverLazy() {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if ('requestIdleCallback' in window) {
            const id = (window as unknown as { requestIdleCallback: (c: () => void) => number }).requestIdleCallback(() => setReady(true));
            return () => (window as unknown as { cancelIdleCallback: (i: number) => void }).cancelIdleCallback(id);
        }
        const t = setTimeout(() => setReady(true), 2500);
        return () => clearTimeout(t);
    }, []);

    if (!ready) return <PrayerShell onClick={() => setReady(true)} />;
    return <PrayerPopover />;
}
