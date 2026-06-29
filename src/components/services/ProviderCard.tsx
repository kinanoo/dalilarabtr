import Link from 'next/link';
import Image from 'next/image';
import { MapPin, PhoneCall, MessageCircle, Briefcase, Star, CheckCircle } from 'lucide-react';
import { canonicalCity } from '@/lib/turkishCities';

export interface ProviderCardData {
    id: string;
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

const waHref = (phone: string | null, profession: string | null) => {
    if (!phone) return '';
    return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(`مرحباً، رأيت خدمتك "${profession || ''}" على موقع دليل العرب.`)}`;
};

/**
 * Server-rendered provider card shared by the category + city landing pages.
 * City is shown via canonicalCity() so mixed spellings collapse on display
 * without touching the stored data. Leads with WhatsApp + a direct call.
 */
export default function ProviderCard({ p }: { p: ProviderCardData }) {
    const hasReviews = !!(p.review_count && p.review_count > 0);
    return (
        <div className="group relative bg-gradient-to-br from-white to-slate-50/60 dark:from-slate-900 dark:to-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-400 hover:-translate-y-1 transition-all duration-300 flex flex-col">
            <div aria-hidden="true" className={`absolute top-0 inset-x-0 h-1 ${p.is_verified ? 'bg-gradient-to-l from-blue-400 via-emerald-400 to-teal-400' : 'bg-slate-200/70 dark:bg-slate-800/40'}`} />
            {p.is_verified && (
                <div className="absolute top-3 left-3 bg-blue-500/10 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full text-[10px] font-black uppercase border border-blue-500/30 z-10 flex items-center gap-1">
                    <CheckCircle size={10} /> موثّق
                </div>
            )}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start gap-3">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center shrink-0 overflow-hidden border border-emerald-100/60 dark:border-slate-700 relative">
                    {p.image ? <Image src={p.image} alt={p.name} fill className="object-cover" sizes="56px" /> : <Briefcase size={22} className="text-emerald-500/70" />}
                </div>
                <div className="min-w-0 flex-1">
                    <h2 className="font-black text-slate-900 dark:text-slate-100 text-base leading-tight line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                        <Link href={`/services/${p.id}`} className="hover:underline">{p.name}</Link>
                    </h2>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 line-clamp-1">{p.profession}</p>
                    <div className="mt-1.5">
                        {hasReviews ? (
                            <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 px-1.5 py-0.5 rounded-full">
                                <Star size={10} className="fill-amber-400 text-amber-400" />
                                <span className="text-[11px] text-amber-700 dark:text-amber-300 font-black tabular-nums">{p.rating ? Number(p.rating).toFixed(1) : '5.0'}</span>
                                <span className="text-[10px] text-amber-600/70 tabular-nums">({p.review_count})</span>
                            </span>
                        ) : (
                            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200/60 px-2 py-0.5 rounded-full uppercase">جديد</span>
                        )}
                    </div>
                </div>
            </div>
            <div className="p-5 flex-grow">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-3 font-medium">
                    <MapPin size={14} className="text-emerald-500/70" />
                    <span>{canonicalCity(p.city)}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed h-[40px]">{p.description || 'اضغط لعرض التفاصيل الكاملة...'}</p>
            </div>
            <div className="p-3 bg-slate-50/80 dark:bg-slate-900/50 mt-auto border-t border-slate-100 dark:border-slate-800">
                <div className="flex gap-2">
                    <a href={waHref(p.phone, p.profession)} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-l from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-2.5 rounded-xl font-black transition-all shadow-md shadow-emerald-500/30 active:scale-95 text-xs">
                        <MessageCircle size={15} /> واتساب
                    </a>
                    {p.phone && (
                        <a href={`tel:${p.phone}`} aria-label={`اتصال بـ ${p.name}`} className="flex items-center justify-center gap-1.5 px-4 bg-white dark:bg-slate-800/60 text-emerald-700 dark:text-emerald-400 py-2.5 rounded-xl font-black text-xs border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 active:scale-95 transition-all">
                            <PhoneCall size={15} /> اتصال
                        </a>
                    )}
                </div>
                <Link href={`/services/${p.id}`} className="mt-2 block text-center text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 transition-colors">عرض كل التفاصيل</Link>
            </div>
        </div>
    );
}
