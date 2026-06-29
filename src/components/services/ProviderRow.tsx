import Link from 'next/link';
import Image from 'next/image';
import { MapPin, PhoneCall, MessageCircle, Star, BadgeCheck } from 'lucide-react';
import { canonicalCity } from '@/lib/turkishCities';
import type { ProviderCardData } from './ProviderCard';

const waHref = (phone: string | null, profession: string | null) => {
    if (!phone) return '';
    return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(`مرحباً، رأيت خدمتك "${profession || ''}" على موقع دليل العرب.`)}`;
};

const GRADS = [
    'from-emerald-500 to-teal-600', 'from-blue-500 to-cyan-600', 'from-violet-500 to-purple-600',
    'from-amber-500 to-orange-600', 'from-rose-500 to-pink-600', 'from-sky-500 to-indigo-600',
];
function gradFor(s: string) { let h = 0; for (const c of s || '?') h = (h * 31 + c.charCodeAt(0)) >>> 0; return GRADS[h % GRADS.length]; }
function initials(name: string) { return (name || '؟').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join(''); }

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
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden relative shadow-sm">
                    {p.image ? (
                        <Image src={p.image} alt={p.name} fill className="object-cover" sizes="56px" />
                    ) : (
                        <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${gradFor(p.name)} text-white font-black`}>{initials(p.name)}</div>
                    )}
                </div>
                {p.is_verified && (
                    <span className="absolute -bottom-1 -left-1 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-sm">
                        <BadgeCheck size={14} className="text-blue-500" />
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
                <a
                    href={waHref(p.phone, p.profession)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white h-10 px-3 sm:px-4 rounded-xl font-black text-xs active:scale-95 transition-all"
                >
                    <MessageCircle size={15} /><span className="hidden sm:inline">واتساب</span>
                </a>
                {p.phone && (
                    <a href={`tel:${p.phone}`} aria-label={`اتصال بـ ${p.name}`} className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 active:scale-95 transition-all">
                        <PhoneCall size={15} />
                    </a>
                )}
            </div>
        </article>
    );
}
