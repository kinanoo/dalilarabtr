import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createElement } from 'react';
import { AlertTriangle, ArrowRight, Briefcase, CheckCircle2, ChevronLeft, MapPin, Search, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { SITE_CONFIG } from '@/lib/config';
import logger from '@/lib/logger';
import DeferredAddServiceBanner from '@/components/services/DeferredAddServiceBanner';
import ProviderCard, { type ProviderCardData } from '@/components/services/ProviderCard';
import { categoryBySlug, categoryForName, type ServiceCategory } from '@/lib/serviceCategories';
import { catIcon } from '@/lib/serviceCategoryIcons';
import { cityBySlug, citySlugForName, type TRCity } from '@/lib/turkishCities';
import { displayServiceProfession } from '@/lib/serviceText';
import { isValidExplicitWhatsApp } from '@/lib/serviceProviderQuality';

export const revalidate = 600;

/**
 * Pre-render the busiest real category/city combinations without creating
 * empty SEO pages. Less common valid combinations remain available on demand.
 */
export async function generateStaticParams(): Promise<Array<{ slug: string; city: string }>> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('service_providers')
        .select('category, city, whatsapp')
        .eq('status', 'approved')
        .not('whatsapp', 'is', null)
        .neq('whatsapp', '')
        .limit(2000);

    if (error || !data) return [];

    const counts = new Map<string, { slug: string; city: string; count: number }>();
    for (const provider of data) {
        if (!isValidExplicitWhatsApp(provider.whatsapp)) continue;
        const category = categoryForName(provider.category);
        const city = citySlugForName(provider.city);
        if (!category || !city) continue;
        const key = `${category.slug}:${city}`;
        const current = counts.get(key);
        counts.set(key, {
            slug: category.slug,
            city,
            count: (current?.count || 0) + 1,
        });
    }

    return Array.from(counts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 80)
        .map(({ slug, city }) => ({ slug, city }));
}

interface Row extends ProviderCardData { category: string | null; }

function CategoryIcon({ slug, size }: { slug: string; size: number }) {
    return createElement(catIcon(slug), { size, 'aria-hidden': true });
}

// Every approved provider in this profession, across all cities. The page needs
// the unfiltered set twice over: once narrowed to this city for the listing,
// and once as a whole to work out which sibling cities are worth linking to.
async function fetchCategoryProviders(cat: ServiceCategory): Promise<Row[]> {
    try {
        if (!supabase) return [];
        const { data } = await supabase
            .from('service_providers')
            .select('id, slug, name, profession, category, description, city, phone, whatsapp, image, is_verified, verification_level, is_featured, rating, review_count')
            .eq('status', 'approved')
            .not('whatsapp', 'is', null)
            .neq('whatsapp', '')
            .in('category', cat.variants)
            .order('is_verified', { ascending: false })
            .order('rating', { ascending: false });
        return (data as Row[]) || [];
    } catch (e) {
        logger.error('category+city providers fetch failed:', e);
        return [];
    }
}

async function fetchCityProviders(city: TRCity): Promise<Row[]> {
    try {
        if (!supabase) return [];
        const cityVariants = Array.from(new Set([city.ar, city.slug, ...city.variants]));
        const { data } = await supabase
            .from('service_providers')
            .select('id, slug, name, profession, category, description, city, phone, whatsapp, image, is_verified, verification_level, is_featured, rating, review_count')
            .eq('status', 'approved')
            .not('whatsapp', 'is', null)
            .neq('whatsapp', '')
            .in('city', cityVariants)
            .order('is_verified', { ascending: false })
            .order('rating', { ascending: false })
            .limit(80);
        return providersInCity((data as Row[]) || [], city);
    } catch (e) {
        logger.error('city providers fetch failed:', e);
        return [];
    }
}

// Match the city across all its spellings (case-insensitive) — no data rewrite.
function providersInCity(rows: Row[], city: TRCity): Row[] {
    return rows.filter((p) => citySlugForName(p.city) === city.slug);
}

// Sibling cities that actually have a provider in this profession. This page
// sets robots:noindex when it has no providers, so linking a fixed slice of
// TR_CITIES meant every one of these pages pointed at ~11 URLs it declares
// unindexable itself. Never link to a URL you mark noindex.
function siblingCitySlugs(rows: Row[], current: TRCity): string[] {
    const slugs = rows.map((p) => citySlugForName(p.city)).filter(Boolean) as string[];
    return Array.from(new Set(slugs)).filter((s) => s !== current.slug);
}

export async function generateMetadata(props: { params: Promise<{ slug: string; city: string }> }): Promise<Metadata> {
    const { slug, city } = await props.params;
    const cat = categoryBySlug(slug);
    const cityObj = cityBySlug(city);
    if (!cat || !cityObj) return { title: 'الصفحة غير موجودة', robots: { index: false, follow: false } };

    const providers = providersInCity(await fetchCategoryProviders(cat), cityObj);
    const title = `${cat.labelAr} في ${cityObj.ar} | دليل الخدمات العربية في تركيا`;
    const description = `اعثر على ${cat.labelAr} وخدمات قريبة في ${cityObj.ar} مع روابط مباشرة للتواصل والتحقق من التفاصيل قبل الاتفاق. ${providers.length > 0 ? `${providers.length} نتيجة متاحة.` : ''}`;

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

    const allInCategory = await fetchCategoryProviders(cat);
    const providers = providersInCity(allInCategory, cityObj);
    const siblingCities = siblingCitySlugs(allInCategory, cityObj);
    const allInCity = await fetchCityProviders(cityObj);
    const cityCategoryLinks = Array.from(
        allInCity.reduce((map, row) => {
            const category = categoryForName(row.category);
            if (!category || category.slug === cat.slug) return map;
            const current = map.get(category.slug);
            map.set(category.slug, {
                slug: category.slug,
                label: category.labelAr,
                count: (current?.count || 0) + 1,
            });
            return map;
        }, new Map<string, { slug: string; label: string; count: number }>()),
    ).map(([, value]) => value).sort((a, b) => b.count - a.count).slice(0, 10);
    const featuredProviders = providers.filter((provider) => provider.is_verified || provider.is_featured).slice(0, 3);
    const base = SITE_CONFIG.siteUrl;
    const pageUrl = `${base}/services/category/${cat.slug}/${cityObj.slug}`;
    const pageTitle = `${cat.labelAr} في ${cityObj.ar}`;
    const pageDescription = `دليل ${cat.labelAr} في ${cityObj.ar} مع نتائج مباشرة وروابط لخدمات قريبة داخل نفس المدينة.`;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'BreadcrumbList',
                '@id': `${pageUrl}#breadcrumb`,
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: base },
                    { '@type': 'ListItem', position: 2, name: 'الخدمات', item: `${base}/services` },
                    { '@type': 'ListItem', position: 3, name: cat.labelAr, item: `${base}/services/category/${cat.slug}` },
                    { '@type': 'ListItem', position: 4, name: cityObj.ar, item: pageUrl },
                ],
            },
            {
                '@type': 'WebPage',
                '@id': `${pageUrl}#webpage`,
                url: pageUrl,
                name: pageTitle,
                description: pageDescription,
                inLanguage: 'ar',
                isPartOf: { '@id': `${base}/#website` },
                breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
                mainEntity: { '@id': `${pageUrl}#directory` },
            },
            {
                '@type': 'CollectionPage',
                '@id': `${pageUrl}#directory`,
                url: pageUrl,
                name: pageTitle,
                description: pageDescription,
                inLanguage: 'ar',
                about: { '@type': 'Service', name: cat.labelAr, areaServed: { '@type': 'City', name: cityObj.ar } },
                mainEntity: {
                    '@type': 'ItemList',
                    numberOfItems: providers.length,
                    itemListElement: providers.map((p, i) => {
                        const biz: Record<string, unknown> = {
                            '@type': 'LocalBusiness',
                            '@id': `${base}/services/${p.slug || p.id}#provider`,
                            name: p.name,
                            url: `${base}/services/${p.slug || p.id}`,
                            ...(p.profession ? { description: displayServiceProfession(p.profession), knowsAbout: displayServiceProfession(p.profession) } : {}),
                            ...(p.category ? { category: p.category } : {}),
                            ...(p.image ? { image: p.image } : {}),
                            ...(p.phone ? { telephone: p.phone } : {}),
                            address: { '@type': 'PostalAddress', addressCountry: 'TR', addressLocality: cityObj.ar },
                            areaServed: { '@type': 'City', name: cityObj.ar },
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

            <section className="relative overflow-hidden border-b border-slate-200 bg-white pb-7 pt-6 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white lg:pt-8">
                <div aria-hidden="true" className="absolute inset-x-0 top-0 z-20 h-1 bg-emerald-600" />
                <div className="container mx-auto px-4 relative z-10 max-w-6xl">
                    <nav className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 mb-4 flex-wrap" aria-label="مسار التنقّل">
                        <Link href="/" className="hover:text-emerald-600">الرئيسية</Link><span>/</span>
                        <Link href="/services" className="hover:text-emerald-600">الخدمات</Link><span>/</span>
                        <Link href={`/services/category/${cat.slug}`} className="hover:text-emerald-600">{cat.labelAr}</Link><span>/</span>
                        <span className="text-slate-800 dark:text-slate-200">{cityObj.ar}</span>
                    </nav>
                    <div className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-end">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-xs font-black text-emerald-700 shadow-sm dark:border-emerald-800 dark:bg-slate-900/70 dark:text-emerald-300">
                                <CategoryIcon slug={cat.slug} size={16} />
                                دليل {cat.labelAr} في {cityObj.ar}
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black mb-3 leading-tight">
                                {cat.labelAr} في <span className="text-emerald-700 dark:text-emerald-400">{cityObj.ar}</span>
                            </h1>
                            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                                اختر مزود خدمة مناسباً، راجع الوصف وطرق التواصل، ثم تواصل مباشرة عبر واتساب أو اتصال.
                            </p>
                            <div className="mt-5 flex flex-wrap gap-2">
                                <a href="#city-category-results" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-black text-white transition hover:bg-emerald-800 active:scale-95 dark:bg-white dark:text-slate-950">
                                    عرض النتائج <ChevronLeft size={16} />
                                </a>
                                <Link href={`/services/category/${cat.slug}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-black text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                    كل {cat.labelAr} في تركيا
                                </Link>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/70 bg-white/80 p-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
                            <div className="rounded-xl bg-slate-50 p-3 text-center ring-1 ring-inset ring-slate-200 dark:bg-slate-950 dark:ring-slate-800">
                                <div className="text-2xl font-black tabular-nums text-slate-900 dark:text-slate-100">{providers.length}</div>
                                <div className="mt-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">نتيجة</div>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-3 text-center ring-1 ring-inset ring-slate-200 dark:bg-slate-950 dark:ring-slate-800">
                                <div className="text-2xl font-black tabular-nums text-slate-900 dark:text-slate-100">{cityCategoryLinks.length}</div>
                                <div className="mt-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">خدمة قريبة</div>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-3 text-center ring-1 ring-inset ring-slate-200 dark:bg-slate-950 dark:ring-slate-800">
                                <div className="text-2xl font-black tabular-nums text-slate-900 dark:text-slate-100">{siblingCities.length}</div>
                                <div className="mt-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">مدينة</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="city-category-results" className="max-w-screen-2xl mx-auto px-4 py-8 sm:py-10 w-full">
                {featuredProviders.length > 0 && (
                    <div className="mb-7 rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm dark:border-emerald-900/60 dark:bg-slate-900">
                        <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                            <ShieldCheck size={18} className="text-emerald-600" />
                            خيارات بارزة في {cityObj.ar}
                        </div>
                        <div className="grid gap-3 md:grid-cols-3">
                            {featuredProviders.map((provider) => (
                                <Link
                                    key={provider.id}
                                    href={`/services/${provider.slug || provider.id}`}
                                    className="group flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-emerald-950/20"
                                >
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-black text-slate-900 group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300">{provider.name}</span>
                                        <span className="mt-0.5 block truncate text-xs font-bold text-slate-500 dark:text-slate-400">{displayServiceProfession(provider.profession)}</span>
                                    </span>
                                    <ChevronLeft size={16} className="shrink-0 text-slate-400 group-hover:text-emerald-600" />
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">النتائج المتاحة</h2>
                        <p className="mt-1 text-sm font-bold text-slate-600 dark:text-slate-300">
                            {providers.length > 0
                                ? <>عرض <span className="text-emerald-600 dark:text-emerald-400 tabular-nums font-black">{providers.length}</span> من {cat.labelAr} في {cityObj.ar}</>
                                : `لا يوجد ${cat.labelAr} مسجّلون في ${cityObj.ar} بعد — كن أوّل من يضيف خدمته.`}
                        </p>
                    </div>
                    <Link href="/services/add" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-800 active:scale-95">
                        أضف خدمتك <Briefcase size={16} />
                    </Link>
                </div>

                {providers.length > 0 && (
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {providers.map((p) => <ProviderCard key={p.id} p={p} />)}
                    </div>
                )}

                {providers.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center dark:border-slate-700 dark:bg-slate-900">
                        <Search size={34} className="mx-auto mb-3 text-slate-400" />
                        <p className="font-black text-slate-900 dark:text-white">لا توجد نتائج مطابقة حالياً</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">جرّب مدينة أخرى أو أضف الخدمة لتظهر في الدليل.</p>
                    </div>
                )}

                <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="mb-3 flex items-center gap-2 text-base font-black text-slate-900 dark:text-white">
                            <CheckCircle2 size={18} className="text-emerald-600" />
                            كيف تختار {cat.labelAr} في {cityObj.ar}؟
                        </h2>
                        <p className="mb-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{cat.guide.intro}</p>
                        <ul className="space-y-2.5">
                            {cat.guide.checklist.map((item, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-sm leading-6 text-slate-700 dark:text-slate-200">
                                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        {cat.guide.note && (
                            <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-bold leading-6 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                                {cat.guide.note}
                            </div>
                        )}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="mb-3 flex items-center gap-2 text-base font-black text-slate-900 dark:text-white">
                            <MapPin size={18} className="text-emerald-600" />
                            خدمات أخرى في {cityObj.ar}
                        </h2>
                        {cityCategoryLinks.length > 0 ? (
                            <div className="grid gap-2">
                                {cityCategoryLinks.map((item) => (
                                    <Link
                                        key={item.slug}
                                        href={`/services/category/${item.slug}/${cityObj.slug}`}
                                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-emerald-950/20"
                                    >
                                        <span>{item.label} في {cityObj.ar}</span>
                                        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-slate-500 shadow-sm dark:bg-slate-900">{item.count}</span>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="rounded-xl bg-slate-50 px-3 py-4 text-sm font-bold text-slate-500 dark:bg-slate-950 dark:text-slate-400">سنضيف روابط خدمات قريبة عندما تتوفر نتائج أكثر في هذه المدينة.</p>
                        )}
                    </div>
                </div>

                {siblingCities.length > 0 && (
                    <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="text-sm font-black text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <MapPin size={16} className="text-emerald-600" /> {cat.labelAr} في مدن أخرى
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            <Link href={`/services/category/${cat.slug}`} className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors">كل المدن</Link>
                            {siblingCities.slice(0, 14).map((cs) => {
                                const co = cityBySlug(cs);
                                return co ? (
                                    <Link key={cs} href={`/services/category/${cat.slug}/${cs}`} className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 hover:text-emerald-600 transition-colors">
                                        {cat.labelAr} في {co.ar}
                                    </Link>
                                ) : null;
                            })}
                        </div>
                    </div>
                )}

                <div className="mt-10">
                    <DeferredAddServiceBanner />
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                    <Link href={`/services/category/${cat.slug}`} className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:gap-3 transition-all">
                        <ArrowRight size={16} /> كل {cat.labelAr} في تركيا
                    </Link>
                    <Link href="/services" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-600 dark:text-slate-400">
                        <Briefcase size={16} /> الرجوع إلى دليل الخدمات
                    </Link>
                </div>
            </section>
        </div>
    );
}
