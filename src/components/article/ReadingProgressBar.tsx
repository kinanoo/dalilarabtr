'use client';

/**
 * ReadingProgressBar — thin emerald bar pinned to the top of the viewport
 * that fills as the user scrolls through the article.
 *
 * Implementation notes:
 *   - Uses requestAnimationFrame throttling so we don't fire a setState on
 *     every scroll event (60+ Hz on modern devices).
 *   - Measures progress against the document body, not the article container,
 *     so the bar reaches 100% when the user hits the page footer rather than
 *     the article end — which feels right after the related-articles section.
 *   - Hides itself when the document is too short to scroll (no progress to
 *     show) instead of sitting at 0% / 100%.
 *   - z-50 so it stays above page chrome but below modal overlays (z-[1020]).
 */

import { useEffect, useState } from 'react';

export default function ReadingProgressBar() {
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        let frame = 0;

        function update() {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const docHeight =
                document.documentElement.scrollHeight - document.documentElement.clientHeight;
            if (docHeight <= 0) {
                setVisible(false);
                setProgress(0);
                return;
            }
            const pct = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));
            setVisible(true);
            setProgress(pct);
        }

        function onScroll() {
            if (frame) return;
            frame = window.requestAnimationFrame(() => {
                frame = 0;
                update();
            });
        }

        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        return () => {
            if (frame) window.cancelAnimationFrame(frame);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, []);

    if (!visible) return null;

    return (
        <div
            className="fixed top-0 left-0 right-0 h-1 bg-transparent z-50 pointer-events-none"
            role="progressbar"
            aria-label="مدى تقدمك في قراءة المقال"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
        >
            <div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-[width] duration-100 ease-out shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}
