import Link from 'next/link';
import { MapPin, Star, BadgeCheck } from 'lucide-react';
import { canonicalCity } from '@/lib/turkishCities';
import ProviderAvatar from './ProviderAvatar';
import ContactButtons from './ContactButtons';
import type { ProviderCardData } from './ProviderCard';
import { SERVICE_VERIFICATION_EXPLANATION, SERVICE_VERIFICATION_LABEL } from '@/lib/serviceVerification';

/**
 * ProviderRow — compact, scannable single-row layout for the "list" view of
 * the services directory. Far denser than the card grid, so 50 providers in a
 * city read in a few screens instead of an endless scroll.
 */
export default function ProviderRow({ p }: { p: ProviderCardData }) {
    const href = `/services/${p.slug || p.id}`;
    const city = canonicalCity(p.city);
    const hasReviews = !!(p.review_count && p.review_count > 0);

    return (
        <article className="group flex items-center gap-3 sm:gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md hover:shadow-emerald-500/5 transition-all">
            <Link href={href} className="relative shrink-0" aria-label={p.name}>
                <ProviderAvatar name={p.name} image={p.image} className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl" />
                {p.is_verified && (
                    <span
                        className="absolute -bottom-1 -left-1 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-sm"
                        title={SERVICE_VERIFICATION_EXPLANATION}
                        aria-label={`${SERVICE_VERIFICATION_LABEL}: ${SERVICE_VERIFICATION_EXPLANATION}`}
                    >
                        <BadgeCheck size={14} className="text-blue-500" aria-hidden="true" />
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
                    <span className="text-emerald-600 dark:text-emerald-400 line-clamp-1">{p.profession}</span>
                    {city && <span className="inline-flex items-center gap-0.5 text-slate-400"><MapPin size={11} />{city}</span>}
                    {hasReviews ? (
                        <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400"><Star size={11} className="fill-amber-400 text-amber-400" />{p.rating ? Number(p.rating).toFixed(1) : '5.0'}</span>
                    ) : (
                        <span className="text-emerald-500">· جديد</span>
                    )}
                </div>
                <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">{p.description}</p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
                <ContactButtons p={p} compact />
            </div>
        </article>
    );
}
