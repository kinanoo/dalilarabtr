import { Metadata } from 'next';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin, PhoneCall, MessageCircle, Briefcase, CheckCircle, ArrowRight, ShieldCheck, Star, ArrowLeft, Globe2, Navigation } from 'lucide-react';
import InlineStarRating from '@/components/services/InlineStarRating';
import UniversalComments from '@/components/community/UniversalCommentsLazy';

import ShareMenu from '@/components/ShareMenu';
import { SITE_CONFIG, getOgImage } from '@/lib/config';
import { categorySlugForName } from '@/lib/serviceCategories';
import { serviceVerificationCopy } from '@/lib/serviceVerification';
import ProviderAvatar from '@/components/services/ProviderAvatar';

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
async function getSupabase() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );
}

// Detail URLs resolve by either the pretty slug (new) or the uuid id (legacy).
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const lookupCol = (key: string): 'id' | 'slug' => (UUID_RE.test(key) ? 'id' : 'slug');

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata(
    props: { params: Promise<{ id: string }> }
): Promise<Metadata> {
    const { id } = await props.params;
    const supabase = await getSupabase();
    const key = decodeURIComponent(id);

    const { data } = await supabase
        .from('service_providers')
        .select('name, profession, city, category, description, image, slug, id')
        .eq(lookupCol(key), key)
        .eq('status', 'approved')
        .single();

    // Pre-stream notFound() → real HTTP 404 (see codes/[code] note).
    if (!data) notFound();
    const canonicalId = data.slug || data.id;

    // No manual brand suffix — the root layout's title template appends
    // "| <brand>" once. Adding "| دليل العرب" here produced a doubled brand.
    const title = `${data.name} - ${data.profession} في ${data.city}`;
    const description = data.description?.substring(0, 160) ||
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
    const supabase = await getSupabase();
    const key = decodeURIComponent(id);

    const { data: provider, error } = await supabase
        .from('service_providers')
        .select('*')
        .eq(lookupCol(key), key)
        .eq('status', 'approved')
        .single();

    if (error || !provider) {
        notFound();
    }

    // Real row id for entity refs (ratings/comments); slug (if any) for URLs.
    const realId: string = provider.id;
    const canonicalId: string = provider.slug || provider.id;
    const verification = serviceVerificationCopy(
        provider.verification_level,
        provider.is_verified,
    );
    const cleanPhone = (provider.phone || '').replace(/\D/g, '');
    const cleanWhatsApp = (provider.whatsapp || provider.phone || '').replace(/\D/g, '');
    const websiteUrl = safeExternalUrl(provider.website);
    const mapUrl = safeExternalUrl(provider.google_maps_url || provider.map_location);
    // Include this listing's link so the provider sees the client came from
    // دليل العرب + which exact service page — trust + lead attribution.
    const listingUrl = `${SITE_CONFIG.siteUrl}/services/${canonicalId}`;
    const whatsappUrl = `https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
        `مرحباً أستاذ ${provider.name}، وصلت إليك عبر موقع "دليل العرب" 🧭\nرأيت خدمتك "${provider.profession}" على هذا الرابط:\n${listingUrl}\nوأود الاستفسار.`
    )}`;

    // Schema.org: Service + LocalBusiness with aggregateRating only when real
    // ratings exist. Never infer pricing or credentials that were not supplied.
    const numericRating = typeof provider.rating === 'number'
        ? provider.rating
        : provider.rating ? Number(provider.rating) : null;
    const reviewCount = typeof provider.review_count === 'number' ? provider.review_count : 0;
    const hasUsableRating = numericRating !== null && !Number.isNaN(numericRating) && reviewCount > 0;
    const catSlug = categorySlugForName(provider.category);
    const serviceLd = {
        '@type': 'Service',
        name: `${provider.profession} — ${provider.name}`,
        description: provider.description || `خدمات ${provider.category} في ${provider.city}`,
        provider: {
            '@type': 'LocalBusiness',
            name: provider.name,
            ...(provider.city && { address: { '@type': 'PostalAddress', addressLocality: provider.city, addressCountry: 'TR' } }),
            ...(cleanPhone && { telephone: cleanPhone }),
            ...(provider.image && { image: provider.image }),
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
        },
        areaServed: { '@type': 'City', name: provider.city || 'تركيا' },
        url: `${SITE_CONFIG.siteUrl}/services/${canonicalId}`,
    };

    // BreadcrumbList — Home › Services › [Category] › Provider. Links the
    // provider into the category landing page hierarchy for Google.
    const breadcrumbLd = {
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE_CONFIG.siteUrl },
            { '@type': 'ListItem', position: 2, name: 'الخدمات', item: `${SITE_CONFIG.siteUrl}/services` },
            ...(catSlug ? [{ '@type': 'ListItem', position: 3, name: provider.category, item: `${SITE_CONFIG.siteUrl}/services/category/${catSlug}` }] : []),
            { '@type': 'ListItem', position: catSlug ? 4 : 3, name: provider.name, item: `${SITE_CONFIG.siteUrl}/services/${canonicalId}` },
        ],
    };

    const jsonLd = { '@context': 'https://schema.org', '@graph': [serviceLd, breadcrumbLd] };

    // Related providers — same profession (same-city first) → crawlable internal
    // links that keep the visitor browsing when this listing isn't the right fit
    // (engagement + more conversions + spreads link equity to sibling pages).
    type Related = { id: string; slug: string | null; name: string; profession: string | null; city: string | null; image: string | null; is_verified: boolean | null; rating: number | null; review_count: number | null };
    let related: Related[] = [];
    try {
        const { data: rel } = await supabase
            .from('service_providers')
            .select('id, slug, name, profession, city, image, is_verified, rating, review_count')
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

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo pb-20" dir="rtl">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            {/* Header / Cover */}
            <div className="bg-gradient-to-l from-emerald-50 via-surface-light to-sky-50 text-slate-900 dark:bg-slate-900 dark:bg-none dark:text-white pt-8 pb-32 relative overflow-hidden">
                <div aria-hidden="true" className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-gov-red via-brand-orange to-brand-blue z-20" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-blue/10 via-transparent to-brand-magenta/10 dark:from-blue-900/40 dark:via-slate-900 dark:to-emerald-900/20" />
                <div className="container mx-auto px-4 relative z-10">
                    <Link
                        href="/services"
                        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors mb-8 bg-slate-900/5 dark:bg-white/5 px-4 py-2 rounded-xl backdrop-blur-sm"
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
                                        {provider.profession}
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
                                    <span>{provider.city}{provider.district && `، ${provider.district}`}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Briefcase size={18} className="text-slate-400" />
                                    {catSlug ? (
                                        <Link href={`/services/category/${catSlug}`} className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors">{provider.category}</Link>
                                    ) : (
                                        <span>{provider.category}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">نبذة عن الخدمة</h2>
                        <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {provider.description || 'لم يتم إضافة نبذة تفصيلية بعد.'}
                        </div>
                    </div>

                    {/* Contact + Share */}
                    <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {cleanWhatsApp && (
                            <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex min-h-14 items-center justify-center gap-3 rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-700 active:scale-95"
                            >
                                <MessageCircle size={22} />
                                تواصل عبر الواتساب
                            </a>
                        )}
                        {cleanPhone && (
                            <a
                                href={`tel:+${cleanPhone}`}
                                className="flex min-h-14 items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-800 transition-colors hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                            >
                                <PhoneCall size={22} />
                                اتصال مباشر
                            </a>
                        )}
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
                            title={`${provider.name} — ${provider.profession}`}
                            text={`${provider.name} — ${provider.profession} في ${provider.city}. تواصل عبر دليل العرب.`}
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
                            {provider.category ? `${provider.category} آخرون قد يهمّونك` : 'مزوّدون آخرون قد يهمّونك'}
                        </h2>
                        {catSlug && (
                            <Link href={`/services/category/${catSlug}`} className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:gap-2 transition-all shrink-0">
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
                                    {r.profession && <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{r.profession}</p>}
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

            {/* Reviews + Comments */}
            <div className="container mx-auto px-4 max-w-4xl pb-12 space-y-8">
                <UniversalComments entityType="service" entityId={realId} />
            </div>
        </div>
    );
}
