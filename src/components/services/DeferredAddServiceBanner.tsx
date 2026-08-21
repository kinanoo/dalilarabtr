'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const AddServiceBanner = dynamic(() => import('@/components/services/AddServiceBanner'));

/** Load the provider conversion UI only when it is close to the viewport. */
export default function DeferredAddServiceBanner() {
    const anchorRef = useRef<HTMLDivElement>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const anchor = anchorRef.current;
        if (!anchor || ready) return;
        if (!('IntersectionObserver' in window)) {
            setReady(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry?.isIntersecting) return;
                setReady(true);
                observer.disconnect();
            },
            { rootMargin: '360px 0px' },
        );
        observer.observe(anchor);
        return () => observer.disconnect();
    }, [ready]);

    return <div ref={anchorRef}>{ready ? <AddServiceBanner /> : null}</div>;
}
