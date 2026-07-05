'use client';

/**
 * HomeConsultantBtn — the primary CTA under the homepage hero search.
 *
 * Kept deliberately light: it sits above the fold, so it uses a plain
 * <button> with a CSS-only hover/tap scale instead of framer-motion —
 * that keeps the animation library out of the homepage's critical JS
 * chunk (the hero must parse/execute before it's interactive). The
 * trust chips live in the separate <HeroTrustStrip/> section rendered
 * right after the hero in page.tsx.
 */

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function HomeConsultantBtn() {
    return (
        <div className="flex flex-col items-center justify-center gap-3">
            <Link href="/consultant">
                <button
                    type="button"
                    className="group relative px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-2xl hover:shadow-emerald-400/50 transition-all duration-300 hover:scale-[1.04] active:scale-95 flex items-center gap-2"
                >
                    <span>ابدأ مع دليل المواقف</span>
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </button>
            </Link>
        </div>
    );
}
