'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Bell } from 'lucide-react';

/**
 * Idle-deferred NotificationBell.
 *
 * The real bell (339 lines + the notifications API module) used to hydrate in
 * every page's first load through Navbar. Nobody opens the notification panel
 * in the first seconds of a page view, so: render a pixel-identical static
 * button immediately, and only load/mount the real component when the browser
 * goes idle (or on click, whichever comes first). `ssr: false` keeps the
 * chunk out of the initial script set — a plain dynamic() would still ship it
 * with the page.
 */
const NotificationBell = dynamic(() => import('./NotificationBell'), {
    ssr: false,
    loading: () => <BellShell />,
});

// Static clone of NotificationBell's zero-unread resting state (button
// classes copied from NotificationBell.tsx — keep in sync if that changes)
// so the swap to the live component is visually seamless.
function BellShell({ onClick }: { onClick?: () => void }) {
    return (
        <div className="relative">
            <button
                type="button"
                onClick={onClick}
                className="group relative p-2.5 min-w-11 min-h-11 flex items-center justify-center rounded-full transition-all duration-300 text-white/90 hover:bg-white/15 hover:text-white"
                aria-label="الإشعارات"
                aria-haspopup="true"
            >
                <Bell size={18} />
            </button>
        </div>
    );
}

export default function NotificationBellLazy() {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if ('requestIdleCallback' in window) {
            const id = (window as any).requestIdleCallback(() => setReady(true));
            return () => (window as any).cancelIdleCallback(id);
        }
        const t = setTimeout(() => setReady(true), 2500);
        return () => clearTimeout(t);
    }, []);

    if (!ready) return <BellShell onClick={() => setReady(true)} />;
    return <NotificationBell />;
}
