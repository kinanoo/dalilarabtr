'use client';

import { useEffect, useRef } from 'react';

/**
 * Adds 'scroll-reveal' class on mount, then 'is-visible' when element enters viewport.
 * CSS in animations.css handles the transition.
 */
export function useScrollReveal<T extends HTMLElement = HTMLElement>() {
    const ref = useRef<T>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        el.classList.add('scroll-reveal');

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.classList.add('is-visible');
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return ref;
}
