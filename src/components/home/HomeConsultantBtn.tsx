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
import { ArrowLeft } from 'lucide-react';

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

        </div>
    );
}
