import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, PhoneCall, MessageCircle, Briefcase, Star, CheckCircle, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { SITE_CONFIG } from '@/lib/config';
import logger from '@/lib/logger';
import AddServiceBanner from '@/components/services/AddServiceBanner';
import {
    SERVICE_CATEGORIES, POPULAR_CITIES, categoryBySlug, type ServiceCategory,
} from '@/lib/serviceCategories';

export const revalidate = 600;

export function generateStaticParams() {
    return SERVICE_CATEGORIES.map((c) => ({ slug: c.slug }));
}

interface Row {
    id: string; slug: string | null; name: string; profession: string | null;
    category: string | null; description: string | null; city: string | null;
    phone: string | null; image: string | null; is_verified: boolean | null;
    rating: number | null; review_count: number | null;
}

async function fetchProviders(cat: ServiceCategory): Promise<Row[]> {
    try {
        if (!supabase) return [];
        const { data } = await supabase
            .from('service_providers')
            .select('id, slug, name, profession, category, description, city, phone, image, is_verified, rating, review_count')
            .eq('status', 'approved')
            .in('category', cat.variants)
            .order('is_verified', { ascending: false })
            .order('rating', { ascending: false })
            .limit(60);
        return (data as Row[]) || [];
    } catch (e) {
        logger.error('category providers fetch failed:', e);
        return [];
    }
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await props.params;
    const cat = categoryBySlug(slug);
    if (!cat) return { title: 'التصنيف غير موجود', robots: { index: false, follow: false } };

    let count = 0;
    try {
        if (supabase) {
            const { count: c } = await supabase
                .from('service_providers')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'approved')
                .in('category', cat.variants);
            count = c || 0;
        }
    } catch { /* best-effort */ }

    const title = `${cat.labelAr} عرب في تركيا — ${cat.blurb} | دليل العرب`;
    const description = `دليل ${cat.labelAr} العرب الموثوقين في تركيا: ${POPULAR_CITIES.slice(0, 4).join('، ')} وغيرها. ${count > 0 ? `${count} ` : ''}${cat.blurb} — تواصل مباشر عبر واتساب.`;

    return {
        title,
        description,
        keywords: cat.keywords,
        alternates: { canonical: `/services/category/${cat.slug}` },
        // Don't let an empty category get indexed as a thin page.
        robots: count === 0 ? { index: false, follow: true } : undefined,
        openGraph: { title, description, url: `${SITE_CONFIG.siteUrl}/services/category/${cat.slug}`, type: 'website', images: ['/og-image.jpg'] },
    };
}

const waHref = (phone: string | null, profession: string | null) => {
    if (!phone) return '';
    return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(`مرحباً، رأيت خدمتك "${profession || ''}" على موقع دليل العرب.`)}`;
};

export default async function CategoryPage(props: { params: Promise<{ slug: string }> }) {
    const { slug } = await props.params;
    const cat = categoryBySlug(slug);
    if (!cat) notFound();

    const providers = await fetchProviders(cat);
    const base = SITE_CONFIG.siteUrl;
    const pageUrl = `${base}/services/category/${cat.slug}`;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: base },
                    { '@type': 'ListItem', position: 2, name: 'الخدمات', item: `${base}/services` },
                    { '@type': 'ListItem', position: 3, name: cat.labelAr, item: pageUrl },
                ],
            },
            {
                '@type': 'CollectionPage',
                '@id': `${pageUrl}#directory`,
                url: pageUrl,
                name: `${cat.labelAr} عرب في تركيا`,
                description: `دليل ${cat.labelAr} العرب الموثوقين في تركيا.`,
                inLanguage: 'ar',
                mainEntity: {
                    '@type': 'ItemList',
                    numberOfItems: providers.length,
                    itemListElement: providers.map((p, i) => {
                        // Detail route resolves by id only — never use slug here.
                        const url = `${base}/services/${p.id}`;
                        const biz: Record<string, unknown> = {
                            '@type': 'LocalBusiness',
                            name: p.name,
                            url,
                            ...(p.profession ? { description: p.profession } : {}),
                            ...(p.image ? { image: p.image } : {}),
                            ...(p.phone ? { telephone: p.phone } : {}),
                            address: { '@type': 'PostalAddress', addressCountry: 'TR', ...(p.city ? { addressLocality: p.city } : {}) },
                        };
                        if (p.review_count && p.review_count > 0 && p.rating) {
                            biz.aggregateRating = { '@type': 'AggregateRating', ratingValue: Number(p.rating).toFixed(1), reviewCount: p.review_count };
                        }
                        return { '@type': 'ListItem', position: i + 1, item: biz };
                    }),
                },
            },
        ],
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo" dir="rtl">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-surface-light to-sky-50 text-slate-900 dark:from-slate-900 dark:via-emerald-950 dark:to-slate-950 dark:text-white pt-6 pb-8 lg:pt-8">
                <div aria-hidden="true" className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-gov-red via-brand-orange to-brand-blue z-20" />
                <div className="container mx-auto px-4 relative z-10 max-w-4xl">
                    {/* Breadcrumb (visible) */}
                    <nav className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 mb-4" aria-label="مسار التنقّل">
                        <Link href="/" className="hover:text-emerald-600">الرئيسية</Link>
                        <span>/</span>
                        <Link href="/services" className="hover:text-emerald-600">الخدمات</Link>
                        <span>/</span>
                        <span className="text-slate-800 dark:text-slate-200">{cat.labelAr}</span>
                    </nav>
                    <h1 className="text-3xl md:text-4xl font-black mb-3 leading-tight">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400">{cat.labelAr}</span> عرب في تركيا
                    </h1>
                    <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                        {cat.blurb} موثوقون في {POPULAR_CITIES.slice(0, 4).join('، ')} وكل المدن. تواصل مباشر عبر واتساب أو اتصال.
                    </p>
                </div>
            </section>

            <AddServiceBanner />

            {/* Providers grid */}
            <section className="max-w-screen-2xl mx-auto px-4 py-12 w-full">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-6">
                    {providers.length > 0
                        ? <>عرض <span className="text-emerald-600 dark:text-emerald-400 tabular-nums font-black">{providers.length}</span> من {cat.labelAr}</>
                        : `لا يوجد ${cat.labelAr} مسجّلون بعد — كن أوّل من يضيف خدمته.`}
                </p>

                {providers.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {providers.map((p) => {
                            const hasReviews = !!(p.review_count && p.review_count > 0);
                            return (
                                <div key={p.id} className="group relative bg-gradient-to-br from-white to-slate-50/60 dark:from-slate-900 dark:to-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-400 hover:-translate-y-1 transition-all duration-300 flex flex-col">
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
                                            <span>{p.city}</span>
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
                        })}
                    </div>
                )}

                {/* Browse other professions — crawlable internal links */}
                <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-black text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <Briefcase size={16} className="text-emerald-600" /> تصفّح حسب التخصّص
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        <Link href="/services" className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">كل الخدمات</Link>
                        {SERVICE_CATEGORIES.filter((c) => c.slug !== cat.slug).map((c) => (
                            <Link key={c.slug} href={`/services/category/${c.slug}`} className="px-4 py-2 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 hover:text-emerald-600 transition-colors">
                                {c.labelAr}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="mt-8">
                    <Link href="/services" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:gap-3 transition-all">
                        <ArrowRight size={16} /> العودة لكل الخدمات
                    </Link>
                </div>
            </section>
        </div>
    );
}
