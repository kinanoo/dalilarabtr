import { Metadata } from 'next';
import { supabase } from '@/lib/supabaseClient';
import { notFound } from 'next/navigation';
import PageHero from '@/components/PageHero';
import { MapPin, ArrowRight, AlertTriangle, CheckCircle2, XCircle, Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import ShareMenu from '@/components/ShareMenu';
import ZoneReportButton from '@/components/zones/ZoneReportButton';
import { SITE_CONFIG } from '@/lib/config';

export const revalidate = 600;

type Props = {
    params: Promise<{ slug: string }>;
};

type Zone = {
    id: string;
    neighborhood: string;
    city: string;
    district: string;
    status: 'closed' | 'reopened' | 'pending' | string | null;
    is_banned: boolean | null;
    reopened_at: string | null;
    community_reopened_count?: number;
    community_closed_count?: number;
};

// 1. Metadata Generation
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const decodedSlug = decodeURIComponent(slug);

    if (!supabase) return { title: `منطقة ${decodedSlug}` };

    // Try finding by neighborhood
    const { data: exactZone } = await supabase
        .from('zones')
        .select('neighborhood, city, district, status')
        .ilike('neighborhood', decodedSlug)
        .limit(1)
        .single();

    if (exactZone) {
        const isClosed = exactZone.status === 'closed';
        const zoneTitle = isClosed
            ? `حي ${exactZone.neighborhood} — مغلق حالياً للأجانب`
            : `حي ${exactZone.neighborhood} — حالة التسجيل`;
        return {
            title: `${zoneTitle} | ${exactZone.city}`,
            description: `تحقّق من حالة حي ${exactZone.neighborhood} في ${exactZone.district} / ${exactZone.city} وفق آخر تحديث رسمي.`,
            alternates: { canonical: `/zones/${decodedSlug}` },
            openGraph: {
                title: zoneTitle,
                images: [{
                    url: `${SITE_CONFIG.siteUrl}/api/og?${new URLSearchParams({ title: zoneTitle, category: 'حالة الأحياء' })}`,
                    width: 1200, height: 630, alt: zoneTitle,
                }],
            },
        };
    }

    // Try finding by district
    const { data: districtZones } = await supabase
        .from('zones')
        .select('id')
        .ilike('district', decodedSlug)
        .limit(1);

    if (districtZones && districtZones.length > 0) {
        const districtTitle = `الأحياء المغلقة والمفتوحة في ${decodedSlug}`;
        return {
            title: `${districtTitle} | تحديث ٢٠٢٦`,
            description: `قائمة محدّثة بحالة الأحياء في منطقة ${decodedSlug} — ما فُتح، ما زال مغلقاً، وما هو قيد التحديث.`,
            alternates: { canonical: `/zones/${decodedSlug}` },
            openGraph: {
                title: districtTitle,
                images: [{
                    url: `${SITE_CONFIG.siteUrl}/api/og?${new URLSearchParams({ title: districtTitle, category: 'حالة الأحياء' })}`,
                    width: 1200, height: 630, alt: districtTitle,
                }],
            },
        };
    }

    // Try finding by city
    const { data: cityZones } = await supabase
        .from('zones')
        .select('id')
        .ilike('city', decodedSlug)
        .limit(1);

    if (cityZones && cityZones.length > 0) {
        const cityTitle = `أحياء ${decodedSlug} — حالة التسجيل الرسمية`;
        return {
            title: `${cityTitle} | تحديث ٢٠٢٦`,
            description: `حالة الأحياء في ولاية ${decodedSlug} وفق آخر مراجعة لقائمة الأحياء المغلقة — ما فُتح حديثاً وما زال مغلقاً.`,
            alternates: { canonical: `/zones/${decodedSlug}` },
            openGraph: {
                title: cityTitle,
                images: [{
                    url: `${SITE_CONFIG.siteUrl}/api/og?${new URLSearchParams({ title: cityTitle, category: 'حالة الأحياء' })}`,
                    width: 1200, height: 630, alt: cityTitle,
                }],
            },
        };
    }

    return { title: 'المنطقة غير موجودة' };
}

// Helper — pretty status pill on the SINGLE zone view.
function statusBadge(status: string | null | undefined) {
    if (status === 'reopened') {
        return {
            wrapBg: 'border-emerald-200 bg-emerald-50/60 dark:bg-emerald-900/10',
            iconBg: 'bg-emerald-100 text-emerald-600',
            pillBg: 'bg-emerald-600 border-emerald-700',
            Icon: CheckCircle2,
            label: '✓ حي مفتوح (رُفع الحظر حديثاً)',
            blurb: (n: string) =>
                `أُعيد فتح حي ${n} ضمن مراجعة الأحياء المغلقة الأخيرة. يحقّ للأجانب الآن تسجيل عناوينهم فيه.`,
        };
    }
    if (status === 'pending') {
        return {
            wrapBg: 'border-amber-200 bg-amber-50/60 dark:bg-amber-900/10',
            iconBg: 'bg-amber-100 text-amber-600',
            pillBg: 'bg-amber-500 border-amber-600',
            Icon: Clock,
            label: '🕒 قائمة الولاية قيد التحديث الرسمي',
            blurb: (n: string) =>
                `بدأ تطبيق المراجعة في هذه الولاية، لكن القائمة النهائية بأسماء الأحياء التي ستبقى مغلقة لم تَصدر بعد. تحقّق من المختار قبل اتّخاذ قرار سكني بشأن ${n}.`,
        };
    }
    return {
        wrapBg: 'border-rose-200 bg-rose-50/60 dark:bg-rose-900/10',
        iconBg: 'bg-rose-100 text-rose-600',
        pillBg: 'bg-rose-600 border-rose-700',
        Icon: XCircle,
        label: '⛔ حي مغلق (لا يُسمح بتسجيل عنوان جديد)',
        blurb: (n: string) =>
            `حي ${n} ضمن قائمة الأحياء المغلقة الصادرة بعد مراجعة ٢٠٢٦. لا يُسمح حالياً بتسجيل عنوان نفوس جديد فيه.`,
    };
}

// Helper card for a list of zones — used by both city and district views.
function ZoneTile({ z }: { z: Zone }) {
    const tone = z.status === 'reopened' ? 'emerald'
        : z.status === 'pending' ? 'amber'
        : 'rose';
    const Icon = tone === 'emerald' ? CheckCircle2 : tone === 'amber' ? Clock : XCircle;
    const styles =
        tone === 'emerald'
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-900 dark:text-emerald-100'
            : tone === 'amber'
                ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 text-amber-900 dark:text-amber-100'
                : 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-900 dark:text-rose-100';
    const iconColor = tone === 'emerald' ? 'text-emerald-600' : tone === 'amber' ? 'text-amber-600' : 'text-rose-600';
    const reportCount = z.community_reopened_count || 0;
    return (
        <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${styles}`}>
            <Icon size={16} className={`shrink-0 mt-0.5 ${iconColor}`} />
            <div className="min-w-0 flex-1">
                <div className="font-bold text-sm leading-snug text-slate-900 dark:text-slate-100 break-words">
                    {z.neighborhood}
                </div>
                {/* Community report widget — only renders on 'closed' zones.
                    The button + badge let visitors who successfully registered
                    their address here flag it so the admin can verify and flip. */}
                <ZoneReportButton
                    zoneId={z.id}
                    initialCount={reportCount}
                    status={(z.status as 'closed' | 'reopened' | 'pending') || 'closed'}
                />
            </div>
        </div>
    );
}

// Section block — heading + count + grid of tiles. Hides itself when empty.
function StatusSection({
    title,
    description,
    items,
    tone,
    Icon,
}: {
    title: string;
    description: string;
    items: Zone[];
    tone: 'emerald' | 'rose' | 'amber';
    Icon: typeof CheckCircle2;
}) {
    if (items.length === 0) return null;
    const pillBg = tone === 'emerald' ? 'bg-emerald-600' : tone === 'amber' ? 'bg-amber-500' : 'bg-rose-600';
    const accent =
        tone === 'emerald' ? 'text-emerald-700 dark:text-emerald-300'
        : tone === 'amber' ? 'text-amber-700 dark:text-amber-300'
        : 'text-rose-700 dark:text-rose-300';

    // Sub-group by district inside the section so the visitor sees district names.
    const byDistrict: Record<string, Zone[]> = {};
    for (const z of items) {
        const d = z.district || 'أخرى';
        if (!byDistrict[d]) byDistrict[d] = [];
        byDistrict[d].push(z);
    }
    const districts = Object.entries(byDistrict).sort((a, b) => b[1].length - a[1].length);

    return (
        <section className="space-y-4">
            <div className="flex items-start gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <Icon size={22} className={accent} />
                    <h2 className={`text-xl sm:text-2xl font-black ${accent}`}>{title}</h2>
                </div>
                <span className={`${pillBg} text-white text-xs font-black px-3 py-1 rounded-full tabular-nums`}>
                    {items.length.toLocaleString('ar-EG')} حي
                </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {description}
            </p>

            {districts.length > 1 ? (
                <div className="space-y-5">
                    {districts.map(([district, zones]) => (
                        <div key={district}>
                            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2.5 flex items-center gap-2">
                                <span className={`${pillBg} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums`}>
                                    {zones.length}
                                </span>
                                {district}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {zones.map((z) => <ZoneTile key={z.id} z={z} />)}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {items.map((z) => <ZoneTile key={z.id} z={z} />)}
                </div>
            )}
        </section>
    );
}

// 2. Page Component
export default async function ZoneDetailPage({ params }: Props) {
    const { slug } = await params;
    const decodedSlug = decodeURIComponent(slug);

    if (!supabase) return notFound();

    let viewType: 'single' | 'district' | 'city' = 'single';
    let singleItem: Zone | null = null;
    let groupItems: Zone[] = [];
    let title = '';

    const ZONE_COLS = 'id, neighborhood, city, district, status, is_banned, reopened_at, community_reopened_count, community_closed_count';

    // 1. Try NEIGHBORHOOD (e.g. "MOLLA GÜRANİ MAHALLESİ")
    {
        const { data } = await supabase
            .from('zones')
            .select(ZONE_COLS)
            .ilike('neighborhood', decodedSlug)
            .limit(1)
            .single();
        if (data) { singleItem = data as Zone; viewType = 'single'; }
    }

    // 2. Try DISTRICT (e.g., "Fatih")
    if (!singleItem) {
        const { data } = await supabase
            .from('zones')
            .select(ZONE_COLS)
            .ilike('district', decodedSlug);
        if (data && data.length > 0) {
            viewType = 'district';
            groupItems = data as Zone[];
            title = data[0].district;
        }
    }

    // 3. Try CITY (e.g., "Istanbul", "Gaziantep")
    if (!singleItem && groupItems.length === 0) {
        const { data } = await supabase
            .from('zones')
            .select(ZONE_COLS)
            .ilike('city', decodedSlug);
        if (data && data.length > 0) {
            viewType = 'city';
            groupItems = data as Zone[];
            title = data[0].city;
        }
    }

    // 4. Fallback: ID check
    if (!singleItem && groupItems.length === 0) {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedSlug);
        if (isUUID) {
            const { data } = await supabase.from('zones').select(ZONE_COLS).eq('id', decodedSlug).single();
            if (data) { singleItem = data as Zone; viewType = 'single'; }
        }
    }

    // ─── A. SINGLE ZONE VIEW ───────────────────────────────────────────
    if (viewType === 'single' && singleItem) {
        const item = singleItem;
        const badge = statusBadge(item.status as string);
        const Icon = badge.Icon;

        return (
            <main className="min-h-screen bg-white dark:bg-slate-950 font-cairo">
                <PageHero
                    title={item.neighborhood}
                    description={`${item.city} - ${item.district}`}
                    icon={<MapPin className="w-10 h-10 md:w-12 md:h-12 text-pink-500" />}
                />
                <div className="max-w-3xl mx-auto px-4 py-12">
                    <Link href="/zones" className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 mb-8 font-bold w-fit transition">
                        <ArrowRight size={20} />
                        عودة للخريطة
                    </Link>

                    <div className={`rounded-3xl border-2 p-8 sm:p-12 text-center shadow-xl ${badge.wrapBg}`}>
                        <div className="mb-6 flex justify-center">
                            <div className={`p-4 rounded-full ${badge.iconBg}`}>
                                <Icon size={48} />
                            </div>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black mb-2 text-slate-800 dark:text-slate-100">{item.neighborhood}</h1>
                        <h2 className="text-xl text-slate-500 font-bold mb-6">{item.district} / {item.city}</h2>

                        <div className={`inline-block px-6 py-2 rounded-xl text-base sm:text-lg font-bold border-2 text-white ${badge.pillBg}`}>
                            {badge.label}
                        </div>
                        <p className="mt-6 text-slate-700 dark:text-slate-200 leading-relaxed max-w-lg mx-auto">
                            {badge.blurb(item.neighborhood)}
                        </p>
                    </div>
                    <div className="mt-8 flex justify-center">
                        <ShareMenu title={`حالة حي ${item.neighborhood}`} />
                    </div>
                </div>
            </main>
        );
    }

    // ─── B. GROUP VIEW (City or District) ─────────────────────────────
    if ((viewType === 'district' || viewType === 'city') && groupItems.length > 0) {
        // Bucket by status — these are the three real-world states we surface.
        const closed: Zone[] = [];
        const reopened: Zone[] = [];
        const pending: Zone[] = [];
        for (const z of groupItems) {
            if (z.status === 'reopened') reopened.push(z);
            else if (z.status === 'pending') pending.push(z);
            else closed.push(z);
        }

        // Structured data: Schema.org Dataset describing the closed-neighborhood
        // list for this province. Google picks this up for richer SERP cards
        // and surfaces it in Dataset Search. Updated/dateModified comes from
        // the most recent reopened_at among rows.
        const lastUpdate = (() => {
            const dates = groupItems
                .map((z) => z.reopened_at)
                .filter((d): d is string => !!d);
            if (dates.length === 0) return new Date().toISOString();
            return new Date(Math.max(...dates.map((d) => new Date(d).getTime()))).toISOString();
        })();
        const datasetJsonLd = {
            '@context': 'https://schema.org',
            '@type': 'Dataset',
            name: `الأحياء المغلقة والمفتوحة في ${title} — تحديث ٢٠٢٦`,
            description: `قائمة محدّثة لحالة الأحياء أمام تسجيل عناوين الأجانب في ${title}: ${closed.length} مغلق، ${reopened.length} مفتوح حديثاً، ${pending.length} قيد التحديث الرسمي.`,
            url: `${SITE_CONFIG.siteUrl}/zones/${encodeURIComponent(title)}`,
            keywords: [
                `أحياء ${title} المغلقة`,
                `أحياء ${title} المفتوحة`,
                `${title} kapalı mahalleler`,
                'تسجيل نفوس تركيا',
                'إقامة سوريين تركيا',
            ].join(', '),
            dateModified: lastUpdate,
            creator: { '@type': 'Organization', name: SITE_CONFIG.name, url: SITE_CONFIG.siteUrl },
            spatialCoverage: { '@type': 'Place', name: title, address: { '@type': 'PostalAddress', addressCountry: 'TR', addressRegion: title } },
            license: 'https://creativecommons.org/licenses/by-sa/4.0/',
            isAccessibleForFree: true,
            includedInDataCatalog: { '@type': 'DataCatalog', name: SITE_CONFIG.name },
            variableMeasured: [
                { '@type': 'PropertyValue', name: 'مغلق', value: closed.length },
                { '@type': 'PropertyValue', name: 'مفتوح حديثاً', value: reopened.length },
                { '@type': 'PropertyValue', name: 'قيد التحديث', value: pending.length },
            ],
        };

        // BreadcrumbList — helps Google show breadcrumbs in the SERP.
        const breadcrumbJsonLd = {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE_CONFIG.siteUrl },
                { '@type': 'ListItem', position: 2, name: 'المناطق المحظورة', item: `${SITE_CONFIG.siteUrl}/zones` },
                { '@type': 'ListItem', position: 3, name: title, item: `${SITE_CONFIG.siteUrl}/zones/${encodeURIComponent(title)}` },
            ],
        };

        const heroTitle = viewType === 'district'
            ? `أحياء ${title}`
            : `أحياء ${title}`;
        const heroDescription = `${reopened.length > 0 ? `${reopened.length} حي فُتح حديثاً · ` : ''}${closed.length > 0 ? `${closed.length} ما زال مغلقاً` : ''}${pending.length > 0 ? ` · ${pending.length} قيد التحديث` : ''}`;

        return (
            <main className="min-h-screen bg-white dark:bg-slate-950 font-cairo">
                {/* JSON-LD for Google: Dataset + BreadcrumbList. Both surface
                    rich SERP features (Dataset Search inclusion + breadcrumb
                    trail on the result card). */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetJsonLd) }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
                />
                <PageHero
                    title={heroTitle}
                    description={heroDescription}
                    icon={<MapPin className="w-10 h-10 md:w-12 md:h-12 text-pink-500" />}
                />
                <div className="max-w-4xl mx-auto px-4 py-12">
                    <Link href="/zones" className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 mb-6 font-bold w-fit transition">
                        <ArrowRight size={20} />
                        عودة للخريطة
                    </Link>

                    {/* Top-of-page summary banner — three stat chips that
                        instantly answer "what's the situation here?" */}
                    <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-900/10 p-3 flex items-center gap-2.5">
                            <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                            <div>
                                <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 tabular-nums">{reopened.length.toLocaleString('ar-EG')}</div>
                                <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">فُتح حديثاً</div>
                            </div>
                        </div>
                        <div className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-900/10 p-3 flex items-center gap-2.5">
                            <XCircle size={20} className="text-rose-600 shrink-0" />
                            <div>
                                <div className="text-xl font-black text-rose-700 dark:text-rose-300 tabular-nums">{closed.length.toLocaleString('ar-EG')}</div>
                                <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400">ما زال مغلقاً</div>
                            </div>
                        </div>
                        <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 p-3 flex items-center gap-2.5">
                            <Clock size={20} className="text-amber-600 shrink-0" />
                            <div>
                                <div className="text-xl font-black text-amber-700 dark:text-amber-300 tabular-nums">{pending.length.toLocaleString('ar-EG')}</div>
                                <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400">قيد التحديث</div>
                            </div>
                        </div>
                    </div>

                    {/* Celebration banner — only when there's actually
                        something positive to announce in this province. */}
                    {reopened.length > 0 && (
                        <div className="mb-6 relative overflow-hidden rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-slate-900 p-4 sm:p-5">
                            <div className="absolute -top-8 -right-8 w-32 h-32 bg-emerald-400/10 rounded-full blur-3xl" aria-hidden="true" />
                            <div className="relative flex items-start gap-3">
                                <div className="bg-emerald-500 text-white p-2 rounded-xl shrink-0">
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <div className="text-xs font-black tracking-[0.15em] uppercase text-emerald-700 dark:text-emerald-400 mb-1">
                                        تحديث ٦ يونيو ٢٠٢٦
                                    </div>
                                    <h2 className="text-lg font-black text-slate-900 dark:text-slate-50 leading-snug">
                                        رُفع الحظر عن {reopened.length.toLocaleString('ar-EG')} حياً في {title}
                                    </h2>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                                        ضمن مراجعة وزارة الداخلية للأحياء التي انخفضت فيها نسبة الأجانب دون عتبة ٢٠٪.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-10">
                        {/* Order: closed first (warning), then reopened (good news), then pending. */}
                        <StatusSection
                            title="الأحياء التي ما زالت مغلقة"
                            description="هذه الأحياء لا يُسمح فيها بتسجيل عناوين نفوس جديدة للأجانب وفق آخر مراجعة رسمية. تحقّق من المختار قبل توقيع أيّ عقد إيجار."
                            items={closed}
                            tone="rose"
                            Icon={XCircle}
                        />
                        <StatusSection
                            title="الأحياء التي فُتحت حديثاً"
                            description="رُفع الحظر عن هذه الأحياء في مراجعة ٦ يونيو ٢٠٢٦. يُسمح فيها الآن بتسجيل عناوين الأجانب."
                            items={reopened}
                            tone="emerald"
                            Icon={CheckCircle2}
                        />
                        <StatusSection
                            title="أحياء قيد التحديث الرسمي"
                            description="بدأ تطبيق المراجعة في الولاية، والقائمة النهائية بأسماء الأحياء التي ستبقى مغلقة لم تَصدر بعد. حالة هذه الأحياء غير محسومة حالياً — تحقّق من المختار قبل قرار سكني."
                            items={pending}
                            tone="amber"
                            Icon={Clock}
                        />
                    </div>

                    <div className="mt-8 flex justify-center">
                        <ShareMenu title={`حالة الأحياء في ${title}`} />
                    </div>
                </div>
            </main>
        );
    }

    // ─── C. NOT FOUND ──────────────────────────────────────────────────
    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center font-cairo bg-white dark:bg-slate-950">
            <div className="bg-slate-50 dark:bg-slate-900 p-8 sm:p-12 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-2xl w-full">
                <div className="mb-6 flex justify-center">
                    <div className="bg-emerald-100 text-emerald-600 p-4 rounded-full animate-bounce-slow">
                        <MapPin size={64} />
                    </div>
                </div>

                <h1 className="text-3xl sm:text-5xl font-black text-slate-800 dark:text-slate-100 mb-4 leading-tight">
                    لم يتم العثور على المنطقة في قائمة الحظر
                </h1>

                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-6 my-6">
                    <p className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400 mb-2">
                        مما يعني أن المنطقة غالباً <span className="underline decoration-wavy decoration-emerald-400">غير محظورة</span> (مفتوحة)
                    </p>
                    <p className="text-sm sm:text-base text-emerald-600/80 dark:text-emerald-500/80">
                        لم نجد أي سجل حظر لهذا الاسم في قاعدة البيانات الرسمية.
                    </p>
                </div>

                <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl text-right mb-8">
                    <AlertTriangle className="text-amber-500 shrink-0 mt-1" size={24} />
                    <div className="text-amber-800 dark:text-amber-200 text-sm sm:text-base font-medium">
                        <strong>تنبيه هام:</strong> تأكد أنك قمت بكتابة اسم الحي أو المنطقة (بالتركي) بشكل <b>صحيح تماماً</b> ومطابق للفاتورة أو عقد الإيجار. حرف واحد خطأ قد يغير النتيجة!
                        <div className="mt-2 text-xs font-mono bg-white/50 dark:bg-black/20 p-2 rounded dir-ltr text-center">
                            بحثك الحالي: <span className="select-all font-bold">&quot;{decodedSlug}&quot;</span>
                        </div>
                    </div>
                </div>

                <Link href="/zones" className="inline-flex items-center gap-2 bg-slate-800 text-white px-8 py-4 rounded-xl font-bold hover:bg-slate-700 hover:shadow-lg hover:-translate-y-1 transition-all text-lg">
                    <ArrowRight size={20} />
                    جرب البحث مرة أخرى
                </Link>
            </div>
        </main>
    );
}
