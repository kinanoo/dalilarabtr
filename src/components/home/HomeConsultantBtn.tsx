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
            <Link
                href="/consultant"
                prefetch={false}
                className="group relative flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-emerald-700 active:bg-emerald-800"
            >
                <span>ابدأ مع دليل المواقف</span>
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
            </Link>
        </div>
    );
}
