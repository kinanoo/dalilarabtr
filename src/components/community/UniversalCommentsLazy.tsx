'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
// Type-only import — erased at compile time, adds nothing to the bundle.
import type { UniversalCommentsProps } from './UniversalComments';

// Comments always sit at the BOTTOM of a page, but a static import put their
// whole graph (UniversalComments + comments/badges APIs + profanity filter +
// sonner toasts) into the page's first-load JS. This wrapper keeps the section
// out of the initial bundle and only downloads it when the visitor actually
// scrolls near it (600px early, so it's mounted before it enters the view).
//
// Drop-in replacement: same props as UniversalComments. Comments were always
// fetched client-side (never in the SSR HTML), so deferring the widget loses
// nothing for SEO.
const UniversalComments = dynamic(() => import('./UniversalComments'), {
    ssr: false,
    // Keep roughly the section's initial height so late-mounting doesn't shift
    // the footer while the visitor is looking at it.
    loading: () => <div className="min-h-[220px]" aria-hidden="true" />,
});

export default function UniversalCommentsLazy(props: UniversalCommentsProps) {
    const anchorRef = useRef<HTMLDivElement>(null);
    const [nearViewport, setNearViewport] = useState(false);

    useEffect(() => {
        if (nearViewport) return;
        const el = anchorRef.current;
        if (!el) return;
        if (typeof IntersectionObserver === 'undefined') {
            setNearViewport(true);
            return;
        }
        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    setNearViewport(true);
                    io.disconnect();
                }
            },
            { rootMargin: '600px 0px' },
        );
        io.observe(el);
        // Safety net: environments that throttle IO callbacks (frozen tabs,
        // some embedded webviews) would otherwise never mount the comments.
        // In normal browsers the observer wins long before this fires.
        const fallback = setTimeout(() => setNearViewport(true), 8000);
        return () => {
            io.disconnect();
            clearTimeout(fallback);
        };
    }, [nearViewport]);

    return (
        <div ref={anchorRef}>
            {nearViewport
                ? <UniversalComments {...props} />
                : <div className="min-h-[220px]" aria-hidden="true" />}
        </div>
    );
}
