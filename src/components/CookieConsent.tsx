'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { getAnalyticsConsent, setAnalyticsConsent } from '@/lib/consent';

// No framer-motion here ON PURPOSE. This banner mounts for every visitor who
// hasn't answered consent yet — i.e. on effectively every first visit — and it
// was the only always-loaded public component importing framer, dragging the
// whole animation runtime (~46KB gz) into the early lazy chunk that executes
// around LCP time on throttled mobile. The slide-up entrance is the
// animate-consent-in keyframe in styles/animations.css — NOT tailwindcss-animate
// classes (animate-in/slide-in-from-bottom-*): that plugin isn't installed
// here, so those classes silently emit no CSS. Exit is an instant unmount,
// which reads fine for a dismissal.

// Hold the notice back until the reader has actually settled into the page.
// Firing it on arrival interrupts the first thing they came for, and it is the
// single most common reason people dismiss without reading. Nothing depends on
// answering it: the site's own visit counting and performance measurement are
// anonymous and run regardless — only Google Analytics waits on this.
const SHOW_AFTER_MS = 20_000;

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        if (pathname.startsWith('/admin')) {
            setIsVisible(false);
            return;
        }
        if (getAnalyticsConsent() !== 'unknown') return;

        const t = window.setTimeout(() => setIsVisible(true), SHOW_AFTER_MS);
        return () => window.clearTimeout(t);
    }, [pathname]);

    const answer = (choice: 'granted' | 'denied') => {
        setAnalyticsConsent(choice);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div
            className="animate-consent-in fixed bottom-3 left-3 right-3 z-[9999] rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:left-auto sm:right-4 sm:w-[400px]"
            role="dialog"
            aria-label="إشعار ملفات تعريف الارتباط"
        >
            <div className="flex items-center gap-3">
                <p className="min-w-0 flex-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    نستخدم ملفات تعريف الارتباط لتحسين تجربتك على الموقع.{' '}
                    <Link href="/privacy" className="font-bold text-emerald-700 underline dark:text-emerald-400">
                        اعرف المزيد
                    </Link>
                </p>

                <button
                    type="button"
                    onClick={() => answer('granted')}
                    className="min-h-10 shrink-0 rounded-lg bg-emerald-600 px-5 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
                >
                    موافق
                </button>

                {/* Dismissing is a decline, not a deferral — otherwise the notice
                    would return on every visit for anyone who ignores it. */}
                <button
                    type="button"
                    onClick={() => answer('denied')}
                    className="flex min-h-10 w-8 shrink-0 items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    aria-label="إغلاق دون الموافقة"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
