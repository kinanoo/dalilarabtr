'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MapPin, Star, BadgeCheck } from 'lucide-react';
import { canonicalCity } from '@/lib/turkishCities';
import ProviderAvatar from './ProviderAvatar';
import ContactButtons from './ContactButtons';
import type { ProviderCardData } from './ProviderCard';
import { serviceVerificationCopy } from '@/lib/serviceVerification';
import { displayServiceProfession } from '@/lib/serviceText';
import { publicServiceDescription } from '@/lib/serviceProviderQuality';

/**
 * ProviderRow — compact, scannable single-row layout for the "list" view of
 * the services directory. Far denser than the card grid, so 50 providers in a
 * city read in a few screens instead of an endless scroll.
 */
export default function ProviderRow({ p }: { p: ProviderCardData }) {
    const [touchActive, setTouchActive] = useState(false);
    const touchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const href = `/services/${p.slug || p.id}`;
    const city = canonicalCity(p.city);
    const hasReviews = !!(p.review_count && p.review_count > 0);
    const verification = serviceVerificationCopy(p.verification_level, p.is_verified);
    const profession = displayServiceProfession(p.profession);
    const description = publicServiceDescription(p.description);
    const startTouchFeedback = () => {
        if (touchTimer.current) clearTimeout(touchTimer.current);
        setTouchActive(true);
    };
    const finishTouchFeedback = () => {
        if (touchTimer.current) clearTimeout(touchTimer.current);
        touchTimer.current = setTimeout(() => setTouchActive(false), 260);
    };
    const flashTouchFeedback = () => {
        startTouchFeedback();
        finishTouchFeedback();
    };

    useEffect(() => () => {
        if (touchTimer.current) clearTimeout(touchTimer.current);
    }, []);

    return (
        <article
            onPointerDown={startTouchFeedback}
            onPointerUp={finishTouchFeedback}
            onPointerCancel={finishTouchFeedback}
            onPointerLeave={finishTouchFeedback}
            onTouchStart={startTouchFeedback}
            onTouchEnd={finishTouchFeedback}
            onMouseDown={startTouchFeedback}
            onMouseUp={finishTouchFeedback}
            onClickCapture={flashTouchFeedback}
            className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-300 before:pointer-events-none before:absolute before:inset-y-3 before:right-0 before:w-1 before:rounded-l-full before:bg-emerald-600 before:opacity-0 before:transition-opacity before:duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg hover:shadow-slate-900/10 hover:before:opacity-100 active:scale-[0.99] active:border-emerald-300 active:bg-emerald-50/40 active:before:opacity-100 focus-within:ring-2 focus-within:ring-emerald-400/25 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-700 dark:active:bg-emerald-950/20 sm:gap-4 sm:p-4 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${touchActive ? '-translate-y-0.5 border-emerald-300 bg-emerald-50/40 shadow-lg shadow-slate-900/10 before:opacity-100 dark:bg-emerald-950/20' : ''}`}
        >
            <Link href={href} className="relative shrink-0 transition-transform duration-300 group-hover:scale-[1.04] group-active:scale-[0.98] motion-reduce:transition-none" aria-label={p.name}>
                <ProviderAvatar name={p.name} image={p.image} className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl" />
                {verification.visible && (
                    <span
                        className="absolute -bottom-1 -left-1 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-sm"
                        title={verification.explanation}
                        aria-label={`${verification.label}: ${verification.explanation}`}
                    >
                        <BadgeCheck size={14} className="text-emerald-600" aria-hidden="true" />
                    </span>
                )}
            </Link>

            <div className="min-w-0 flex-1">
                <Link href={href}>
                    <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm sm:text-[15px] leading-snug line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {p.name}
                    </h3>
                </Link>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] sm:text-xs font-bold flex-wrap">
                    <span className="text-emerald-600 dark:text-emerald-400 line-clamp-1">{profession}</span>
                    {city && <span className="inline-flex items-center gap-0.5 text-slate-400"><MapPin size={11} />{city}</span>}
                    {hasReviews ? (
                        <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400"><Star size={11} className="fill-amber-400 text-amber-400" />{p.rating ? Number(p.rating).toFixed(1) : '5.0'}</span>
                    ) : null}
                </div>
                {description && <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">{description}</p>}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
                <ContactButtons p={p} compact />
            </div>
        </article>
    );
}
