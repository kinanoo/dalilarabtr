'use client';

/**
 * HomeConsultantBtn — the primary CTA under the homepage hero search.
 *
 * 2026-06-09 rebuild:
 *   - Trimmed the button itself (smaller padding + base font size).
 *     User feedback: the old version was too dominant on mobile, took
 *     visual weight away from the search input above it.
 *   - Absorbed the three trust-signal badges that used to live in a
 *     separate HeroTrustStrip section below the hero. The standalone
 *     strip created a hard visual seam between the dark hero and the
 *     content below it; merging the chips INTO the hero (right under
 *     the button) keeps the seam gone and gives the chips a quieter
 *     contextual role — they support the CTA rather than competing
 *     with it.
 *   - Faint-gold (amber-200/30 over the dark hero) chip styling: the
 *     emerald CTA above is the action, the gold beneath whispers
 *     "trust + heritage" without trying to steal the eye.
 */

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, RadioTower, MessageSquareText } from 'lucide-react';

// The three trust signals that used to live in HeroTrustStrip.
// Kept the same labels so anyone arriving from saved/shared screenshots
// still sees the familiar wording.
const TRUST_SIGNALS = [
    { icon: ShieldCheck, label: 'مصادر رسمية' },
    { icon: RadioTower, label: 'تحديث مباشر' },
    { icon: MessageSquareText, label: 'بالعربية للسوريين والعرب' },
] as const;

export default function HomeConsultantBtn() {
    return (
        <div className="flex flex-col items-center justify-center gap-3">
            {/* Smaller CTA — px-5 py-2.5 instead of px-6 py-3, text-sm
                instead of text-base. Still emerald + bold so it reads
                as the primary action, just no longer dominates the
                hero composition. */}
            <Link href="/consultant">
                <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="group relative px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-2xl hover:shadow-emerald-400/50 transition-all duration-300 flex items-center gap-2"
                >
                    <span>ابدأ مع دليل المواقف</span>
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </motion.button>
            </Link>

            {/* Trust signals — faint gold over the dark hero. Color is
                amber-200 with low opacity (visible enough to read, low
                enough to feel like a watermark, not a CTA). Tiny font
                + minimal padding so the trio reads as "context for the
                button above", not as its own section. */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 max-w-md">
                {TRUST_SIGNALS.map(({ icon: Icon, label }) => (
                    <span
                        key={label}
                        className="inline-flex items-center gap-1 text-slate-600 dark:text-amber-200/75 text-[10px] sm:text-[11px] font-bold bg-white/80 dark:bg-white/[0.03] border border-slate-200 dark:border-amber-200/15 rounded-full px-2 py-0.5 whitespace-nowrap shadow-sm"
                    >
                        <Icon size={11} className="text-emerald-600 dark:text-amber-300/80" />
                        <span>{label}</span>
                    </span>
                ))}
            </div>
        </div>
    );
}
