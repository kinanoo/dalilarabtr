import { Metadata } from 'next';
import { supabase } from '@/lib/supabaseClient';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import Link from 'next/link';
import { MapPin, PhoneCall, MessageCircle, Briefcase, CheckCircle, ArrowRight, ShieldCheck, Star, ArrowLeft, Globe2, Navigation, AlertTriangle } from 'lucide-react';
import InlineStarRating from '@/components/services/InlineStarRating';
import UniversalComments from '@/components/community/UniversalCommentsLazy';

import ShareMenu from '@/components/ShareMenu';
import { SITE_CONFIG, getOgImage } from '@/lib/config';
import { categoryForName } from '@/lib/serviceCategories';
import { canonicalCity, cityBySlug, citySlugForName } from '@/lib/turkishCities';
import { serviceVerificationCopy } from '@/lib/serviceVerification';
import ProviderAvatar from '@/components/services/ProviderAvatar';
import DirectWhatsAppLink from '@/components/services/DirectWhatsAppLink';
import { cleanServiceText, displayServiceProfession } from '@/lib/serviceText';
import { retrySupabaseQuery, throwSupabaseQueryError } from '@/lib/supabaseQuery';

export const revalidate = 60;

const safeExternalUrl = (value: unknown): string | null => {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
        const parsed = new URL(value.trim());
        return parsed.protocol === 'http:' || parsed.protocol === 'https:'
            ? parsed.toString()
            : null;
    } catch {
        return null;
    }
};

// ─── Shared helper ────────────────────────────────────────────────────────────
// Plain anon client, no cookies. Every visitor sees the same public provider
// row and the session is never read here, but a cookie-bound client forces
// dynamic rendering — which made `revalidate` above a no-op and re-ran these
// queries on every view.
async function getSupabase() {
    return supabase;
}

// Detail URLs resolve by either the pretty slug (new) or the uuid id (legacy).
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const lookupCol = (key: string): 'id' | 'slug' => (UUID_RE.test(key) ? 'id' : 'slug');

type ProviderRow = { [key: string]: any };

const fetchProviderData = cache(async (id: string): Promise<ProviderRow | null> => {
    const client = await getSupabase();
    if (!client) return null;
    const key = decodeURIComponent(id);

    const { data, error } = await retrySupabaseQuery('service provider detail', () =>
        client
            .from('service_providers')
            .select('*')
            .eq(lookupCol(key), key)
            .eq('status', 'approved')
            .maybeSingle(),
    );

    if (error) {
        throwSupabaseQueryError('service provider detail', error);
    }

    return data;
});

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata(
    props: { params: Promise<{ id: string }> }
): Promise<Metadata> {
    const { id } = await props.params;
    const data = await fetchProviderData(id);

    // Pre-stream notFound() → real HTTP 404 (see codes/[code] note).
    if (!data) notFound();
    const canonicalId = data.slug || data.id;

    // No manual brand suffix — the root layout's title template appends
    // "| <brand>" once. Adding "| دليل العرب" here produced a doubled brand.
    const profession = displayServiceProfession(data.profession);
    const title = `${data.name} - ${profession} في ${data.city}`;
    const description = cleanServiceText(data.description)?.substring(0, 160) ||
        `تواصل مع ${data.name} للحصول على خدمات ${data.category} في ${data.city}.`;
    const ogImage = getOgImage(data.image, { title });

    return {
        title,
        description,
        alternates: { canonical: `/services/${canonicalId}` },
        openGraph: {
            title,
            description,
            images: [{ url: ogImage, width: 1200, height: 630, alt: data.name }],
        },
    };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function ServiceDetailsPage(
    props: { params: Promise<{ id: string }> }
) {
    const { id } = await props.params;
    const provider = await fetchProviderData(id);
    const supabase = await getSupabase();

    if (!provider) {
        notFound();
    }
    if (!supabase) notFound();

    // Real row id for entity refs (ratings/comments); slug (if any) for URLs.
    const realId: string = provider.id;
    const canonicalId: string = provider.slug || provider.id;
    const verification = serviceVerificationCopy(
        provider.verification_level,
        provider.is_verified,
    );
    const cleanPhone = (provider.phone || '').replace(/\D/g, '');
    const cleanWhatsApp = (provider.whatsapp || provider.phone || '').replace(/\D/g, '');
    const providerProfession = displayServiceProfession(provider.profession);
    const providerDescription = cleanServiceText(provider.description);
    const providerCity = canonicalCity(provider.city);
    const providerCitySlug = citySlugForName(provider.city);
    const category = categoryForName(provider.category);
    const catSlug = category?.slug;
    const categoryLabel = category?.labelAr || provider.category || providerProfession;
    const websiteUrl = safeExternalUrl(provider.website);
    const mapUrl = safeExternalUrl(provider.google_maps_url || provider.map_location);
    // Include this listing's link so the provider sees the client came from
    // دليل العرب + which exact service page — trust + lead attribution.
    const listingUrl = `${SITE_CONFIG.siteUrl}/services/${canonicalId}`;
    const whatsappText = `مرحباً أستاذ ${provider.name}، وصلت إليك عبر موقع "دليل العرب" 🧭\nرأيت خدمتك "${providerProfession}" على هذا الرابط:\n${listingUrl}\nوأود الاستفسار.`;

    // Schema.org: explicit WebPage + Service + LocalBusiness + Breadcrumb.
    // Only publish facts we actually have; no inferred credentials or prices.
    const numericRating = typeof provider.rating === 'number'
        ? provider.rating
        : provider.rating ? Number(provider.rating) : null;
    const reviewCount = typeof provider.review_count === 'number' ? provider.review_count : 0;
    const hasUsableRating = numericRating !== null && !Number.isNaN(numericRating) && reviewCount > 0;
    const localBusinessLd = {
        '@type': 'LocalBusiness',
        '@id': `${listingUrl}#provider`,
        name: provider.name,
        url: listingUrl,
        ...(providerDescription && { description: providerDescription }),
        ...(providerProfession && { knowsAbout: providerProfession }),
        ...(provider.category && { category: provider.category }),
        ...(provider.image && { image: provider.image }),
        ...(cleanPhone && { telephone: cleanPhone }),
        ...(providerCity && { address: { '@type': 'PostalAddress', addressLocality: providerCity, addressCountry: 'TR' } }),
        ...(providerCity && { areaServed: { '@type': 'City', name: providerCity } }),
        ...(websiteUrl && { sameAs: [websiteUrl] }),
        ...(hasUsableRating ? {
            aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: numericRating,
                reviewCount,
                bestRating: 5,
                worstRating: 1,
            },
        } : {}),
        ...(provider.price_range ? { priceRange: provider.price_range } : {}),
    };
    const serviceLd = {
        '@type': 'Service',
        '@id': `${listingUrl}#service`,
        name: `${providerProfession} - ${provider.name}`,
        serviceType: providerProfession,
        category: categoryLabel,
        description: providerDescription || `خدمات ${categoryLabel} في ${providerCity || 'تركيا'}`,
        provider: { '@id': `${listingUrl}#provider` },
        areaServed: { '@type': 'City', name: providerCity || 'تركيا' },
        url: listingUrl,
    };
    const webPageLd = {
        '@type': 'WebPage',
        '@id': `${listingUrl}#webpage`,
        url: listingUrl,
        name: `${provider.name} - ${providerProfession}`,
        description: providerDescription || `تواصل مع ${provider.name} للحصول على ${categoryLabel} في ${providerCity || 'تركيا'}.`,
        inLanguage: 'ar',
        isPartOf: { '@id': `${SITE_CONFIG.siteUrl}/#website` },
        mainEntity: { '@id': `${listingUrl}#service` },
        breadcrumb: { '@id': `${listingUrl}#breadcrumb` },
    };

    // BreadcrumbList — Home › Services › [Category] › Provider. Links the
    // provider into the category landing page hierarchy for Google.
    const breadcrumbLd = {
        '@type': 'BreadcrumbList',
        '@id': `${listingUrl}#breadcrumb`,
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE_CONFIG.siteUrl },
            { '@type': 'ListItem', position: 2, name: 'الخدمات', item: `${SITE_CONFIG.siteUrl}/services` },
            ...(catSlug ? [{ '@type': 'ListItem', position: 3, name: categoryLabel, item: `${SITE_CONFIG.siteUrl}/services/category/${catSlug}` }] : []),
            ...(catSlug && providerCitySlug ? [{ '@type': 'ListItem', position: 4, name: providerCity, item: `${SITE_CONFIG.siteUrl}/services/category/${catSlug}/${providerCitySlug}` }] : []),
            { '@type': 'ListItem', position: catSlug && providerCitySlug ? 5 : catSlug ? 4 : 3, name: provider.name, item: listingUrl },
        ],
    };

    const jsonLd = { '@context': 'https://schema.org', '@graph': [webPageLd, serviceLd, localBusinessLd, breadcrumbLd] };

    // Related providers — same profession (same-city first) → crawlable internal
    // links that keep the visitor browsing when this listing isn't the right fit
    // (engagement + more conversions + spreads link equity to sibling pages).
    type Related = { id: string; slug: string | null; name: string; profession: string | null; category: string | null; city: string | null; image: string | null; is_verified: boolean | null; rating: number | null; review_count: number | null };
    let related: Related[] = [];
    try {
        const { data: rel } = await supabase
            .from('service_providers')
            .select('id, slug, name, profession, category, city, image, is_verified, rating, review_count')
            .eq('status', 'approved')
            .eq('category', provider.category)
            .neq('id', realId)
            .order('is_verified', { ascending: false })
            .order('rating', { ascending: false })
            .limit(9);
        related = (rel as Related[]) || [];
        if (provider.city) {
            related.sort((a, b) => Number(b.city === provider.city) - Number(a.city === provider.city));
        }
        related = related.slice(0, 6);
    } catch { /* best-effort — related is a nice-to-have */ }

    let sameCityServices: Related[] = [];
    try {
        const cityObj = providerCitySlug ? cityBySlug(providerCitySlug) : undefined;
        const cityVariants = cityObj
            ? Array.from(new Set([cityObj.ar, cityObj.slug, ...cityObj.variants]))
            : provider.city ? [provider.city] : [];
        if (cityVariants.length > 0) {
            const { data: cityRows } = await supabase
                .from('service_providers')
                .select('id, slug, name, profession, category, city, image, is_verified, rating, review_count')
                .eq('status', 'approved')
                .in('city', cityVariants)
                .neq('id', realId)
                .order('is_verified', { ascending: false })
                .order('rating', { ascending: false })
                .limit(24);
            sameCityServices = ((cityRows as Related[]) || [])
                .filter((row) => row.category !== provider.category)
                .slice(0, 6);
        }
    } catch { /* best-effort */ }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo pb-20" dir="rtl">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            {/* Header / Cover */}
            <div className="bg-gradient-to-l from-emerald-50 via-surface-light to-sky-50 text-slate-900 dark:bg-slate-900 dark:bg-none dark:text-white pt-8 pb-32 relative overflow-hidden">
                <div aria-hidden="true" className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-gov-red via-brand-orange to-brand-blue z-20" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-blue/10 via-transparent to-brand-magenta/10 dark:from-blue-900/40 dark:via-slate-900 dark:to-emerald-900/20" />
                <div className="container mx-auto px-4 relative z-10 max-w-5xl">
                    <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400" aria-label="مسار التنقّل">
                        <Link href="/" className="hover:text-emerald-600">الرئيسية</Link><span>/</span>
                        <Link href="/services" className="hover:text-emerald-600">الخدمات</Link><span>/</span>
                        {catSlug && <Link href={`/services/category/${catSlug}`} className="hover:text-emerald-600">{categoryLabel}</Link>}
                        {catSlug && <span>/</span>}
                        {catSlug && providerCitySlug && <Link href={`/services/category/${catSlug}/${providerCitySlug}`} className="hover:text-emerald-600">{providerCity}</Link>}
                        {catSlug && providerCitySlug && <span>/</span>}
                        <span className="text-slate-800 dark:text-slate-200">{provider.name}</span>
                    </nav>
                    <Link
                        href="/services"
                        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors bg-slate-900/5 dark:bg-white/5 px-4 py-2 rounded-xl backdrop-blur-sm"
                    >
                        <ArrowRight size={18} />
                        <span className="text-sm font-bold">العودة للخدمات</span>
                    </Link>
                </div>
            </div>

            {/* Profile Card */}
            <div className="container mx-auto px-4 relative z-20 -mt-24 max-w-4xl">
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 mb-8">
                    <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
                        {/* Avatar */}
                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-xl shrink-0 overflow-hidden relative flex items-center justify-center -mt-16 sm:-mt-20 z-30">
                            {provider.image ? (
                                <ProviderAvatar
                                    name={provider.name}
                                    image={provider.image}
                                    className="h-full w-full rounded-none shadow-none"
                                />
                            ) : (
                                <Briefcase size={48} className="text-slate-300" />
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 w-full text-center sm:text-right">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                                        {provider.name}
                                        {verification.visible && (
                                            <CheckCircle className="text-blue-500 shrink-0" size={24} />
                                        )}
                                    </h1>
                                    <p className="text-emerald-600 dark:text-emerald-400 font-bold text-lg mt-1">
                                        {providerProfession}
                                    </p>
                                </div>
                                <InlineStarRating
                                    serviceId={realId}
                                    serviceName={provider.name}
                                    currentRating={provider.review_count && provider.rating
                                        ? Number(provider.rating)
                                        : 0}
                                    reviewCount={provider.review_count || 0}
                                />
                            </div>

                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-6 text-sm text-slate-600 dark:text-slate-300 font-medium">
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={18} className="text-slate-400" />
                                    <span>{providerCity || provider.city}{provider.district && `، ${provider.district}`}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Briefcase size={18} className="text-slate-400" />
                                    {catSlug ? (
                                        <Link href={providerCitySlug ? `/services/category/${catSlug}/${providerCitySlug}` : `/services/category/${catSlug}`} className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors">{categoryLabel}</Link>
                                    ) : (
                                        <span>{categoryLabel}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">نبذة عن الخدمة</h2>
                        <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {providerDescription || 'لم يتم إضافة نبذة تفصيلية بعد.'}
                        </div>
                    </div>

                    {/* Contact + trust */}
                    <div className="mt-10 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-black text-slate-900 dark:text-white">تواصل مع مقدم الخدمة</h2>
                                <p className="mt-1 text-xs font-bold leading-5 text-slate-600 dark:text-slate-300">افتح واتساب أو اتصل مباشرة، واذكر أنك وصلت عبر دليل العرب.</p>
                            </div>
                            <MessageCircle size={24} className="shrink-0 text-emerald-600 dark:text-emerald-300" />
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {cleanWhatsApp && (
                                <DirectWhatsAppLink
                                    phone={provider.whatsapp || provider.phone || ''}
                                    text={whatsappText}
                                    className="flex min-h-14 items-center justify-center gap-3 rounded-xl bg-emerald-700 px-5 py-3 font-black text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-800 active:scale-95"
                                >
                                    <MessageCircle size={22} />
                                    واتساب الآن
                                </DirectWhatsAppLink>
                            )}
                            {cleanPhone && (
                                <a
                                    href={`tel:+${cleanPhone}`}
                                    className="flex min-h-14 items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 font-black text-slate-800 transition-colors hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                >
                                    <PhoneCall size={22} />
                                    اتصال مباشر
                                </a>
                            )}
                        </div>
                        <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-bold leading-6 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                            تحقّق من تفاصيل الخدمة والسعر والهوية قبل الدفع. دليل العرب يسهّل الوصول ولا يضمن نتيجة التعامل خارج الموقع.
                        </div>
                    </div>

                    {verification.visible && (
                        <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-200">
                            <ShieldCheck size={20} className="mt-0.5 shrink-0" />
                            <p>
                                <span className="font-black">{verification.label}:</span>{' '}
                                {verification.explanation}
                            </p>
                        </div>
                    )}

                    <div className="mt-4 flex justify-center">
                        <ShareMenu
                            title={`${provider.name} — ${providerProfession}`}
                            text={`${provider.name} — ${providerProfession} في ${provider.city}. تواصل عبر دليل العرب.`}
                            url={`${SITE_CONFIG.siteUrl}/services/${canonicalId}`}
                        />
                    </div>

                    {(websiteUrl || mapUrl || provider.address_details) && (
                        <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
                            <div className="flex flex-wrap items-center justify-center gap-2">
                                {websiteUrl && (
                                    <a
                                        href={websiteUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                    >
                                        <Globe2 size={17} />
                                        الموقع الرسمي
                                    </a>
                                )}
                                {mapUrl && (
                                    <a
                                        href={mapUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                    >
                                        <Navigation size={17} />
                                        فتح الخريطة
                                    </a>
                                )}
                            </div>
                            {provider.address_details && (
                                <p className="mx-auto mt-3 max-w-2xl text-center text-xs leading-6 text-slate-500 dark:text-slate-400">
                                    {provider.address_details}
                                </p>
                            )}
                        </div>
                    )}
                    <p className="mt-5 border-t border-slate-100 pt-4 text-center text-xs leading-6 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                        هل هذه خدمتك أو وجدت معلومة غير صحيحة؟{' '}
                        <Link
                            href={`/contact?subject=service-data&provider=${encodeURIComponent(provider.name)}`}
                            className="font-black text-emerald-700 hover:underline dark:text-emerald-400"
                        >
                            اطلب امتلاك الصفحة أو تعديلها أو حذفها
                        </Link>
                    </p>
                </div>
            </div>

            {/* Related providers — crawlable internal links + keeps visitors browsing */}
            {related.length > 0 && (
                <div className="container mx-auto px-4 max-w-4xl pb-4">
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            خدمات مشابهة
                        </h2>
                        {catSlug && (
                            <Link href={providerCitySlug ? `/services/category/${catSlug}/${providerCitySlug}` : `/services/category/${catSlug}`} className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:gap-2 transition-all shrink-0">
                                عرض الكل <ArrowLeft size={16} />
                            </Link>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {related.map((r) => (
                            <Link
                                key={r.id}
                                href={`/services/${r.slug || r.id}`}
                                className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-start gap-3 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md transition-all"
                            >
                                <ProviderAvatar
                                    name={r.name}
                                    image={r.image}
                                    className="h-14 w-14 shrink-0 rounded-xl"
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight">
                                        <span className="truncate">{r.name}</span>
                                        {serviceVerificationCopy(null, r.is_verified).visible && <CheckCircle size={14} className="text-blue-500 shrink-0" />}
                                    </div>
                                    {r.profession && <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{displayServiceProfession(r.profession)}</p>}
                                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                        {r.city && <span className="inline-flex items-center gap-0.5"><MapPin size={11} />{r.city}</span>}
                                        {!!(r.review_count && r.review_count > 0 && r.rating) && (
                                            <span className="inline-flex items-center gap-0.5 tabular-nums"><Star size={11} className="text-amber-400 fill-amber-400" />{Number(r.rating).toFixed(1)}</span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {sameCityServices.length > 0 && (
                <div className="container mx-auto px-4 max-w-4xl pb-4">
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            خدمات أخرى في {providerCity || provider.city}
                        </h2>
                        <Link href="/services" className="inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-all shrink-0">
                            الدليل الكامل <ArrowLeft size={16} />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sameCityServices.map((r) => {
                            const relatedCat = categoryForName(r.category);
                            const relatedCatSlug = relatedCat?.slug;
                            return (
                                <Link
                                    key={r.id}
                                    href={`/services/${r.slug || r.id}`}
                                    className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-start gap-3 hover:border-cyan-400 dark:hover:border-cyan-600 hover:shadow-md transition-all"
                                >
                                    <ProviderAvatar
                                        name={r.name}
                                        image={r.image}
                                        className="h-14 w-14 shrink-0 rounded-xl"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-white group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition-colors leading-tight">
                                            <span className="truncate">{r.name}</span>
                                            {serviceVerificationCopy(null, r.is_verified).visible && <CheckCircle size={14} className="text-blue-500 shrink-0" />}
                                        </div>
                                        {r.profession && <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{displayServiceProfession(r.profession)}</p>}
                                        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                            {relatedCatSlug && providerCitySlug && (
                                                <span className="rounded-full bg-cyan-50 px-2 py-1 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300">
                                                    {relatedCat?.labelAr}
                                                </span>
                                            )}
                                            {!!(r.review_count && r.review_count > 0 && r.rating) && (
                                                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-1 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                                                    <Star size={11} className="text-amber-400 fill-amber-400" />{Number(r.rating).toFixed(1)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Reviews + Comments */}
            <div className="container mx-auto px-4 max-w-4xl pb-12 space-y-8">
                <UniversalComments entityType="service" entityId={realId} />
            </div>
        </div>
    );
}
