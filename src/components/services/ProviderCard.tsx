'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MapPin, Star, BadgeCheck, ChevronLeft } from 'lucide-react';
import { canonicalCity } from '@/lib/turkishCities';
import { toLatinDigits } from '@/lib/digits';
import ProviderAvatar from './ProviderAvatar';
import ContactButtons from './ContactButtons';
import { serviceVerificationCopy } from '@/lib/serviceVerification';
import { displayServiceProfession } from '@/lib/serviceText';
import { publicServiceDescription } from '@/lib/serviceProviderQuality';

export interface ProviderCardData {
    id: string;
    slug: string | null;
    name: string;
    profession: string | null;
    city: string | null;
    description: string | null;
    phone: string | null;
    whatsapp?: string | null;
    image: string | null;
    is_verified: boolean | null;
    verification_level?: string | null;
    is_featured?: boolean | null;
    rating: number | null;
    review_count: number | null;
}

/** A stable directory card shared by the main, category, and city results. */
export default function ProviderCard({ p }: { p: ProviderCardData }) {
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
            className={`group relative flex min-h-[190px] h-full flex-col overflow-hidden rounded-lg border bg-white p-4 shadow-sm outline-none [content-visibility:auto] [contain-intrinsic-size:190px] transition-[transform,box-shadow,border-color,background-color] duration-300 before:pointer-events-none before:absolute before:inset-y-4 before:right-0 before:w-1 before:rounded-l-full before:bg-emerald-700 before:opacity-0 before:transition-opacity before:duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/10 hover:before:opacity-100 active:scale-[0.985] active:border-emerald-300 active:bg-emerald-50/40 active:before:opacity-100 focus-within:ring-2 focus-within:ring-emerald-400/25 dark:bg-slate-900 dark:active:bg-emerald-950/20 sm:p-5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${touchActive ? '-translate-y-1 border-emerald-300 bg-emerald-50/40 shadow-lg shadow-slate-900/10 before:opacity-100 dark:bg-emerald-950/20' : ''} ${
            p.is_featured
                ? 'border-slate-300 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700'
                : 'border-slate-200 dark:border-slate-800 hover:shadow-emerald-500/10 hover:border-emerald-300 dark:hover:border-emerald-700'
        }`}
        >
            <div className="flex items-start gap-3.5">
                <Link href={href} className="relative shrink-0 transition-transform duration-300 group-hover:scale-[1.04] group-active:scale-[0.98] motion-reduce:transition-none" aria-label={p.name}>
                    <ProviderAvatar name={p.name} image={p.image} className="h-14 w-14 rounded-lg text-base sm:h-16 sm:w-16 sm:text-lg" />
                    {verification.visible && (
                        <span
                            className="absolute -bottom-1 -left-1 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-sm"
                            title={verification.explanation}
                            aria-label={`${verification.label}: ${verification.explanation}`}
                        >
                            <BadgeCheck size={16} className="text-emerald-600" aria-hidden="true" />
                        </span>
                    )}
                </Link>

                <div className="min-w-0 flex-1">
                    <Link href={href}>
                        <h3 className="line-clamp-2 text-base font-black leading-6 text-slate-950 transition-colors group-hover:text-emerald-800 dark:text-slate-100 dark:group-hover:text-emerald-400">
                            {p.name}
                        </h3>
                    </Link>
                    <p className="mt-0.5 line-clamp-1 text-xs font-black text-emerald-700 dark:text-emerald-400">{profession}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        {city && (
                            <span className="inline-flex items-center gap-1"><MapPin size={12} className="text-slate-400" />{city}</span>
                        )}
                        {hasReviews ? (
                            <span className="inline-flex items-center gap-0.5 text-amber-700 dark:text-amber-400">
                                <Star size={12} className="fill-amber-400 text-amber-400" />{p.rating ? Number(p.rating).toFixed(1) : '5.0'}
                                <span className="text-amber-500/70">({p.review_count})</span>
                            </span>
                        ) : null}
                        {p.is_featured && (
                            <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                                <Star size={12} className="fill-amber-500 text-amber-500" /> مميّز
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Description */}
            {description && (
                <p className="mt-3 line-clamp-2 text-[13px] leading-6 text-slate-600 dark:text-slate-300 sm:min-h-12">
                    {toLatinDigits(description)}
                </p>
            )}

            {/* Actions */}
            <div className="mt-auto flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <Link
                    href={href}
                    aria-label="عرض التفاصيل"
                    className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[hsl(200,42%,24%)] px-4 text-xs font-black text-white transition-colors hover:bg-emerald-800 active:scale-[0.98] dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-emerald-500 dark:hover:text-slate-950 sm:h-[42px]"
                >
                    عرض التفاصيل
                    <ChevronLeft size={16} aria-hidden="true" />
                </Link>
                <ContactButtons p={p} compact subtle showCompactLabel />
            </div>
        </article>
    );
}
