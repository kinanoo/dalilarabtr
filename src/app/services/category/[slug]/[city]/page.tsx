import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, MapPin, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { SITE_CONFIG } from '@/lib/config';
import logger from '@/lib/logger';
import AddServiceBanner from '@/components/services/AddServiceBanner';
import ProviderCard, { type ProviderCardData } from '@/components/services/ProviderCard';
import { categoryBySlug, type ServiceCategory } from '@/lib/serviceCategories';
import { cityBySlug, citySlugForName, TR_CITIES, type TRCity } from '@/lib/turkishCities';

export const revalidate = 600;

interface Row extends ProviderCardData { category: string | null; }

async function fetchProviders(cat: ServiceCategory, city: TRCity): Promise<Row[]> {
    try {
        if (!supabase) return [];
        const { data } = await supabase
            .from('service_providers')
            .select('id, slug, name, profession, category, description, city, phone, image, is_verified, rating, review_count')
            .eq('status', 'approved')
            .in('category', cat.variants)
            .order('is_verified', { ascending: false })
            .order('rating', { ascending: false });
        // Match the city across all its spellings (case-insensitive) — no data rewrite.
        return ((data as Row[]) || []).filter((p) => citySlugForName(p.city) === city.slug);
    } catch (e) {
        logger.error('category+city providers fetch failed:', e);
        return [];
    }
}

export async function generateMetadata(props: { params: Promise<{ slug: string; city: string }> }): Promise<Metadata> {
    const { slug, city } = await props.params;
    const cat = categoryBySlug(slug);
    const cityObj = cityBySlug(city);
    if (!cat || !cityObj) return { title: 'الصفحة غير موجودة', robots: { index: false, follow: false } };

    const providers = await fetchProviders(cat, cityObj);
    const title = `${cat.labelAr} عرب في ${cityObj.ar} | دليل العرب`;
    const description = `${cat.labelAr} ${cat.blurb} يتحدّثون العربية في ${cityObj.ar}، تركيا. ${providers.length > 0 ? `${providers.length} ` : ''}مهنيّ — تواصل مباشر عبر واتساب أو اتصال.`;

    return {
        title,
        description,
        keywords: [...cat.keywords.map((k) => `${k} ${cityObj.ar}`), `${cat.labelAr} ${cityObj.ar}`],
        alternates: { canonical: `/services/category/${cat.slug}/${cityObj.slug}` },
        robots: providers.length === 0 ? { index: false, follow: true } : undefined,
        openGraph: { title, description, url: `${SITE_CONFIG.siteUrl}/services/category/${cat.slug}/${cityObj.slug}`, type: 'website', images: ['/og-banner.jpg'] },
    };
}

export default async function CategoryCityPage(props: { params: Promise<{ slug: string; city: string }> }) {
    const { slug, city } = await props.params;
    const cat = categoryBySlug(slug);
    const cityObj = cityBySlug(city);
    if (!cat || !cityObj) notFound();

    const providers = await fetchProviders(cat, cityObj);
    const base = SITE_CONFIG.siteUrl;
    const pageUrl = `${base}/services/category/${cat.slug}/${cityObj.slug}`;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: base },
                    { '@type': 'ListItem', position: 2, name: 'الخدمات', item: `${base}/services` },
                    { '@type': 'ListItem', position: 3, name: cat.labelAr, item: `${base}/services/category/${cat.slug}` },
                    { '@type': 'ListItem', position: 4, name: cityObj.ar, item: pageUrl },
                ],
            },
            {
                '@type': 'CollectionPage',
                '@id': `${pageUrl}#directory`,
                url: pageUrl,
                name: `${cat.labelAr} عرب في ${cityObj.ar}`,
                inLanguage: 'ar',
                mainEntity: {
                    '@type': 'ItemList',
                    numberOfItems: providers.length,
                    itemListElement: providers.map((p, i) => {
                        const biz: Record<string, unknown> = {
                            '@type': 'LocalBusiness',
                            name: p.name,
                            url: `${base}/services/${p.slug || p.id}`,
                            ...(p.profession ? { description: p.profession } : {}),
                            ...(p.image ? { image: p.image } : {}),
                            ...(p.phone ? { telephone: p.phone } : {}),
                            address: { '@type': 'PostalAddress', addressCountry: 'TR', addressLocality: cityObj.ar },
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

            <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-surface-light to-sky-50 text-slate-900 dark:from-slate-900 dark:via-emerald-950 dark:to-slate-950 dark:text-white pt-6 pb-8 lg:pt-8">
                <div aria-hidden="true" className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-gov-red via-brand-orange to-brand-blue z-20" />
                <div className="container mx-auto px-4 relative z-10 max-w-4xl">
                    <nav className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 mb-4 flex-wrap" aria-label="مسار التنقّل">
                        <Link href="/" className="hover:text-emerald-600">الرئيسية</Link><span>/</span>
                        <Link href="/services" className="hover:text-emerald-600">الخدمات</Link><span>/</span>
                        <Link href={`/services/category/${cat.slug}`} className="hover:text-emerald-600">{cat.labelAr}</Link><span>/</span>
                        <span className="text-slate-800 dark:text-slate-200">{cityObj.ar}</span>
                    </nav>
                    <h1 className="text-3xl md:text-4xl font-black mb-3 leading-tight">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400">{cat.labelAr}</span> عرب في {cityObj.ar}
                    </h1>
                    <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                        {cat.blurb} يتحدّثون العربية في {cityObj.ar}. تواصل مباشر عبر واتساب أو اتصال.
                    </p>
                </div>
            </section>

            <AddServiceBanner />

            <section className="max-w-screen-2xl mx-auto px-4 py-12 w-full">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-6">
                    {providers.length > 0
                        ? <>عرض <span className="text-emerald-600 dark:text-emerald-400 tabular-nums font-black">{providers.length}</span> من {cat.labelAr} في {cityObj.ar}</>
                        : `لا يوجد ${cat.labelAr} مسجّلون في ${cityObj.ar} بعد — كن أوّل من يضيف خدمته.`}
                </p>

                {providers.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {providers.map((p) => <ProviderCard key={p.id} p={p} />)}
                    </div>
                )}

                {/* Compact evergreen guide — same practical advice as the
                    profession landing, scoped to this city. */}
                <div className={providers.length > 0 ? 'mt-12 pt-8 border-t border-slate-200 dark:border-slate-800' : 'mt-2'}>
                    <div className="max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                        <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mb-3">
                            كيف تختار {cat.labelAr} في {cityObj.ar}؟
                        </h2>
                        <p className="text-sm leading-7 text-slate-600 dark:text-slate-300 mb-4">{cat.guide.intro}</p>
                        <ul className="space-y-2.5">
                            {cat.guide.checklist.map((item, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-sm leading-6 text-slate-700 dark:text-slate-200">
                                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Same profession in other cities — crawlable internal links */}
                <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-black text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <MapPin size={16} className="text-emerald-600" /> {cat.labelAr} في مدن أخرى
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        <Link href={`/services/category/${cat.slug}`} className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">كل المدن</Link>
                        {TR_CITIES.filter((c) => c.slug !== cityObj.slug).slice(0, 12).map((c) => (
                            <Link key={c.slug} href={`/services/category/${cat.slug}/${c.slug}`} className="px-4 py-2 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 hover:text-emerald-600 transition-colors">
                                {cat.labelAr} في {c.ar}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="mt-8">
                    <Link href={`/services/category/${cat.slug}`} className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:gap-3 transition-all">
                        <ArrowRight size={16} /> كل {cat.labelAr} في تركيا
                    </Link>
                </div>
            </section>
        </div>
    );
}
