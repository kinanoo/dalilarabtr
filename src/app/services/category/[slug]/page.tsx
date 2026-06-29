import { Metadata } from 'next';
import type { ElementType } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
    Briefcase, MapPin, ArrowRight, Stethoscope, Scale, Languages, Home as HomeIcon,
    GraduationCap, Sparkles, ShieldCheck, Car, UtensilsCrossed, Package, Plane, Wrench,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { SITE_CONFIG } from '@/lib/config';
import logger from '@/lib/logger';
import AddServiceBanner from '@/components/services/AddServiceBanner';
import ProviderCard, { type ProviderCardData } from '@/components/services/ProviderCard';
import {
    SERVICE_CATEGORIES, POPULAR_CITIES, categoryBySlug, type ServiceCategory,
} from '@/lib/serviceCategories';
import { cityBySlug, citySlugForName } from '@/lib/turkishCities';

export const revalidate = 600;

// Per-profession icon for the landing-page hero.
const CAT_ICONS: Record<string, ElementType> = {
    doctors: Stethoscope, lawyers: Scale, translators: Languages, 'real-estate': HomeIcon,
    education: GraduationCap, beauty: Sparkles, insurance: ShieldCheck, cars: Car,
    restaurants: UtensilsCrossed, cargo: Package, tourism: Plane, general: Wrench,
};

export function generateStaticParams() {
    return SERVICE_CATEGORIES.map((c) => ({ slug: c.slug }));
}

interface Row extends ProviderCardData { category: string | null; }

async function fetchProviders(cat: ServiceCategory): Promise<Row[]> {
    try {
        if (!supabase) return [];
        const { data } = await supabase
            .from('service_providers')
            .select('id, name, profession, category, description, city, phone, image, is_verified, rating, review_count')
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
        robots: count === 0 ? { index: false, follow: true } : undefined,
        openGraph: { title, description, url: `${SITE_CONFIG.siteUrl}/services/category/${cat.slug}`, type: 'website', images: ['/og-image.jpg'] },
    };
}

export default async function CategoryPage(props: { params: Promise<{ slug: string }> }) {
    const { slug } = await props.params;
    const cat = categoryBySlug(slug);
    if (!cat) notFound();

    const providers = await fetchProviders(cat);
    // Cities that actually have providers in this profession → crawlable links.
    const cityChips = Array.from(new Set(providers.map((p) => citySlugForName(p.city)).filter(Boolean))) as string[];
    const Icon = CAT_ICONS[cat.slug] || Briefcase;
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
                    <nav className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 mb-4" aria-label="مسار التنقّل">
                        <Link href="/" className="hover:text-emerald-600">الرئيسية</Link>
                        <span>/</span>
                        <Link href="/services" className="hover:text-emerald-600">الخدمات</Link>
                        <span>/</span>
                        <span className="text-slate-800 dark:text-slate-200">{cat.labelAr}</span>
                    </nav>
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/25 mb-3">
                        <Icon size={24} />
                    </span>
                    <h1 className="text-3xl md:text-4xl font-black mb-3 leading-tight">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400">{cat.labelAr}</span> عرب في تركيا
                    </h1>
                    <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                        {cat.blurb} موثوقون في {POPULAR_CITIES.slice(0, 4).join('، ')} وكل المدن. تواصل مباشر عبر واتساب أو اتصال.
                    </p>
                </div>
            </section>

            <AddServiceBanner />

            <section className="max-w-screen-2xl mx-auto px-4 py-12 w-full">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-6">
                    {providers.length > 0
                        ? <>عرض <span className="text-emerald-600 dark:text-emerald-400 tabular-nums font-black">{providers.length}</span> من {cat.labelAr}</>
                        : `لا يوجد ${cat.labelAr} مسجّلون بعد — كن أوّل من يضيف خدمته.`}
                </p>

                {providers.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {providers.map((p) => <ProviderCard key={p.id} p={p} />)}
                    </div>
                )}

                {/* Same profession by city — crawlable internal links */}
                {cityChips.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
                        <h2 className="text-sm font-black text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <MapPin size={16} className="text-emerald-600" /> {cat.labelAr} حسب المدينة
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {cityChips.map((cs) => {
                                const co = cityBySlug(cs);
                                return co ? (
                                    <Link key={cs} href={`/services/category/${cat.slug}/${cs}`} className="px-4 py-2 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 hover:text-emerald-600 transition-colors">
                                        {cat.labelAr} في {co.ar}
                                    </Link>
                                ) : null;
                            })}
                        </div>
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
