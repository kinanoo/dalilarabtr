import Link from 'next/link';
import { MapPin, Star, BadgeCheck } from 'lucide-react';
import { canonicalCity } from '@/lib/turkishCities';
import ProviderAvatar from './ProviderAvatar';
import ContactButtons from './ContactButtons';

export interface ProviderCardData {
    id: string;
    slug: string | null;
    name: string;
    profession: string | null;
    city: string | null;
    description: string | null;
    phone: string | null;
    image: string | null;
    is_verified: boolean | null;
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

    return (
        <article className="group relative flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-300 dark:hover:border-emerald-700 hover:-translate-y-0.5 transition-all duration-300">
            {/* Header — avatar + name + trust */}
            <div className="flex items-start gap-3">
                <Link href={href} className="relative shrink-0" aria-label={p.name}>
                    <ProviderAvatar name={p.name} image={p.image} className="w-14 h-14 rounded-2xl text-lg" />
                    {p.is_verified && (
                        <span className="absolute -bottom-1 -left-1 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-sm">
                            <BadgeCheck size={16} className="text-blue-500" />
                        </span>
                    )}
                </Link>

                <div className="min-w-0 flex-1">
                    <Link href={href}>
                        <h3 className="font-black text-slate-900 dark:text-slate-100 text-[15px] leading-snug line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {p.name}
                        </h3>
                    </Link>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 line-clamp-1 mt-0.5">{p.profession}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                        {city && (
                            <span className="inline-flex items-center gap-0.5"><MapPin size={12} className="text-slate-400" />{city}</span>
                        )}
                        {hasReviews ? (
                            <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                                <Star size={12} className="fill-amber-400 text-amber-400" />{p.rating ? Number(p.rating).toFixed(1) : '5.0'}
                                <span className="text-amber-500/70">({p.review_count})</span>
                            </span>
                        ) : (
                            <span className="text-emerald-600 dark:text-emerald-400">· جديد</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Description */}
            <p className="mt-3 text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 min-h-[38px]">
                {p.description || 'اضغط لعرض التفاصيل الكاملة وطرق التواصل.'}
            </p>

            {/* Actions */}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <ContactButtons p={p} />
                <Link
                    href={href}
                    aria-label="عرض التفاصيل"
                    className="inline-flex items-center justify-center w-11 h-[42px] rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all text-lg font-black"
                >
                    ‹
                </Link>
            </div>
        </article>
    );
}
