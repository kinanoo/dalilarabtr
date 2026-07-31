import Link from 'next/link';
import { MapPin, Star, BadgeCheck, ChevronLeft } from 'lucide-react';
import { canonicalCity } from '@/lib/turkishCities';
import { toLatinDigits } from '@/lib/digits';
import ProviderAvatar from './ProviderAvatar';
import ContactButtons from './ContactButtons';
import { serviceVerificationCopy } from '@/lib/serviceVerification';
import { cleanServiceText, displayServiceProfession } from '@/lib/serviceText';

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

/**
 * ProviderCard — compact, modern directory card. Avatar-forward, single
 * action row, coloured-initials fallback. Shared by the services list and the
 * category / city landing pages. City shown via canonicalCity (display-only
 * normalisation).
 */
export default function ProviderCard({ p }: { p: ProviderCardData }) {
    const href = `/services/${p.slug || p.id}`;
    const city = canonicalCity(p.city);
    const hasReviews = !!(p.review_count && p.review_count > 0);
    const verification = serviceVerificationCopy(p.verification_level, p.is_verified);
    const profession = displayServiceProfession(p.profession);
    const description = cleanServiceText(p.description);

    return (
        <article className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white p-4 shadow-sm outline-none transition-all duration-300 before:pointer-events-none before:absolute before:inset-x-4 before:top-0 before:h-1 before:rounded-b-full before:bg-gradient-to-l before:from-emerald-500 before:via-cyan-500 before:to-amber-400 before:opacity-0 before:transition-opacity before:duration-300 hover:-translate-y-1 hover:shadow-xl hover:before:opacity-100 active:scale-[0.985] active:border-emerald-300 active:bg-emerald-50/40 active:before:opacity-100 focus-within:ring-2 focus-within:ring-emerald-400/25 dark:bg-slate-900 dark:active:bg-emerald-950/20 sm:p-5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
            p.is_featured
                ? 'border-amber-300 dark:border-amber-700/60 ring-1 ring-amber-200/70 dark:ring-amber-800/40 hover:shadow-amber-500/10 hover:border-amber-400'
                : 'border-slate-200 dark:border-slate-800 hover:shadow-emerald-500/10 hover:border-emerald-300 dark:hover:border-emerald-700'
        }`}>
            {/* Featured (paid) ribbon */}
            {p.is_featured && (
                <span className="absolute -top-2 start-3 z-10 inline-flex items-center gap-1 bg-gradient-to-l from-amber-500 to-yellow-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm shadow-amber-500/40">
                    <Star size={10} className="fill-white text-white" /> مميّز
                </span>
            )}
            {/* Header — avatar + name + trust */}
            <div className="flex items-start gap-3">
                <Link href={href} className="relative shrink-0 transition-transform duration-300 group-hover:scale-[1.04] group-active:scale-[0.98] motion-reduce:transition-none" aria-label={p.name}>
                    <ProviderAvatar name={p.name} image={p.image} className="h-16 w-16 rounded-2xl text-lg" />
                    {verification.visible && (
                        <span
                            className="absolute -bottom-1 -left-1 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-sm"
                            title={verification.explanation}
                            aria-label={`${verification.label}: ${verification.explanation}`}
                        >
                            <BadgeCheck size={16} className="text-blue-500" aria-hidden="true" />
                        </span>
                    )}
                </Link>

                <div className="min-w-0 flex-1">
                    <Link href={href}>
                        <h3 className="line-clamp-2 text-[15px] font-black leading-snug text-slate-900 transition-colors group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-400">
                            {p.name}
                        </h3>
                    </Link>
                    <p className="mt-1 line-clamp-1 text-xs font-black text-emerald-700 dark:text-emerald-400">{profession}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        {city && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800"><MapPin size={12} className="text-slate-400" />{city}</span>
                        )}
                        {hasReviews ? (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-1 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                                <Star size={12} className="fill-amber-400 text-amber-400" />{p.rating ? Number(p.rating).toFixed(1) : '5.0'}
                                <span className="text-amber-500/70">({p.review_count})</span>
                            </span>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Description */}
            <p className="mt-4 min-h-[42px] flex-1 text-[13px] leading-7 text-slate-600 line-clamp-2 dark:text-slate-300">
                {toLatinDigits(description) || 'اضغط لعرض التفاصيل الكاملة وطرق التواصل.'}
            </p>

            {/* Actions */}
            <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <ContactButtons p={p} />
                <Link
                    href={href}
                    aria-label="عرض التفاصيل"
                    className="inline-flex h-[42px] items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-black text-slate-600 transition-all hover:bg-slate-200 active:scale-95 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                    تفاصيل
                    <ChevronLeft size={18} aria-hidden="true" />
                </Link>
            </div>
        </article>
    );
}
