import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
    MapPin, Navigation, ExternalLink, ShieldCheck, CalendarClock, Info,
    ChevronDown, HelpCircle, ArrowLeft, Building2, Landmark, AlertTriangle,
} from 'lucide-react';
import PageHero from '@/components/PageHero';
import ShareMenu from '@/components/ShareMenu';
import { SITE_CONFIG } from '@/lib/config';
import {
    OFFICIAL_PLACES, MISSION_PLACES, OFFICE_KINDS, PLACE_CITIES,
    placeBySlug, placeMapUrl, placeDirectionsUrl, placeGroupById, officePlace,
    type OfficialPlace,
} from '@/lib/officialPlaces';

// ISR + dynamicParams (NOT force-static) — the only prerendered dynamic-route
// shape @opennextjs/cloudflare actually serves on Workers; /city/[slug] and
// /tools/pharmacy/[city] both proved the force-static variant 404s in
// production. Every action here is an outbound link to Google Maps or an
// official portal, so a day-long cache costs nothing.
export const revalidate = 86400;
export const dynamicParams = true;

// Prerender the high-demand set (every mission + the offices of the provinces
// with the largest Arab populations); the rest of the ~380 pages render on
// first request and are cached from then on. Prerendering all of them would
// triple build time for pages almost nobody opens.
const PRERENDERED_OFFICE_CITIES = ['istanbul', 'gaziantep', 'ankara', 'bursa', 'mersin', 'sanliurfa'];

export function generateStaticParams() {
    return OFFICIAL_PLACES
        .filter((p) => p.kind === 'single' || PRERENDERED_OFFICE_CITIES.includes(p.citySlug))
        .map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const place = placeBySlug(slug);
    // notFound() HERE, not just in the page body: generateMetadata runs before
    // the response streams, so it yields a real HTTP 404. Calling it only in
    // the component let the stream commit a 200 first and Google filed the
    // result as "Crawled – not indexed" (a soft-404). Same fix as /codes/[code].
    if (!place) notFound();

    const title = place.kind === 'single'
        ? `${place.ar} — الموقع على الخريطة والعنوان والاتجاهات (${place.tr})`
        : `${place.ar} — أقرب فرع إليك على الخريطة (${place.tr})`;

    const description = place.kind === 'single'
        ? `موقع ${place.ar} على خرائط جوجل مباشرة: الاتجاهات من موقعك، رقم الهاتف وساعات العمل كما هي مسجّلة اليوم. ${place.what}`
        : `افتح أقرب ${place.shortAr} إليك في ${place.cityAr} على خرائط جوجل — الاتجاهات وساعات العمل. ${place.what}`;

    return {
        title,
        description,
        keywords: [
            place.ar, `عنوان ${place.ar}`, `موقع ${place.ar}`, `اين تقع ${place.ar}`,
            `${place.shortAr} ${place.cityAr}`, place.tr, place.mapQuery,
            'خرائط جوجل', 'الاتجاهات',
        ].join(', '),
        alternates: { canonical: `/places/${place.slug}` },
        openGraph: {
            title: `${place.ar} — الموقع على الخريطة`,
            description,
            url: `${SITE_CONFIG.siteUrl}/places/${place.slug}`,
            type: 'website',
            images: ['/og-banner.jpg'],
        },
    };
}

function buildFaqs(place: OfficialPlace) {
    const faqs = [
        {
            q: place.kind === 'single'
                ? `أين يقع ${place.ar} بالتحديد؟`
                : `كيف أجد أقرب ${place.shortAr} إليّ في ${place.cityAr}؟`,
            a: place.kind === 'single'
                ? `اضغط زر «افتح الموقع على خرائط جوجل» أعلى الصفحة — يفتح بحثاً حياً باسم المقر الرسمي «${place.mapQuery}»، فترى الموقع الحالي والعنوان ورقم الهاتف وساعات العمل كما هي مسجّلة اليوم، وتستطيع بدء الاتجاهات من مكانك فوراً.`
                : `اضغط زر «افتح الموقع على خرائط جوجل» أعلى الصفحة، واسمح للخرائط بالوصول إلى موقعك — تظهر فروع ${place.shortAr} في ${place.cityAr} مرتّبة من الأقرب إليك، مع العنوان والهاتف وساعات العمل والاتجاهات.`,
        },
        {
            q: `هل الموقع المعروض محدّث؟`,
            a: `نعم. نحن لا نخزّن عنواناً ثابتاً قد يتغيّر — الرابط يفتح بحثاً حياً في خرائط جوجل باسم الجهة الرسمي. فإن نُقل المقر أو تغيّر رقم الهاتف أو ساعات العمل، ترى المعلومة الحالية لا معلومة قديمة عندنا.`,
        },
    ];

    if (place.appointment) {
        faqs.push({
            q: `هل أحتاج موعداً مسبقاً في ${place.shortAr}؟`,
            a: `معظم معاملات ${place.shortAr} تتطلّب موعداً إلكترونياً مسبقاً. احجز من البوابة الرسمية (${place.appointment.label}) قبل التوجّه، واحمل معك رقم الموعد والوثائق الأصلية — المراجعة بدون موعد قد تُرفض.`,
        });
    }

    if (place.kind === 'single') {
        faqs.push({
            q: `ما ساعات عمل ${place.ar}؟`,
            a: `ساعات العمل تختلف من مقر لآخر وتتأثّر بالعطل الرسمية في تركيا وفي بلد المقر. الأدق دائماً هو ما تعرضه بطاقة المكان على خرائط جوجل عند فتح الرابط أعلى الصفحة، ويُنصح بالاتصال بالرقم المعروض هناك قبل التوجّه، خصوصاً في المواسم والعطل.`,
        });
    } else {
        faqs.push({
            q: `ما الوثائق التي أحملها معي؟`,
            a: `احمل دائماً الأصل والصورة: الكملك أو بطاقة الإقامة، الجواز إن وُجد، ووثيقة إثبات السكن، بالإضافة إلى ما تطلبه معاملتك تحديداً. راجع دليل المواقف على موقعنا لمعرفة قائمة أوراق معاملتك قبل الذهاب.`,
        });
    }

    return faqs;
}

export default async function PlacePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const place = placeBySlug(slug);
    if (!place) notFound();

    const baseUrl = SITE_CONFIG.siteUrl;
    const pageUrl = `${baseUrl}/places/${place.slug}`;
    const mapUrl = placeMapUrl(place);
    const dirUrl = placeDirectionsUrl(place);
    const group = placeGroupById(place.groupId);
    const faqs = buildFaqs(place);
    const city = PLACE_CITIES.find((c) => c.slug === place.citySlug);

    // Siblings: for a mission, the other missions in the same city; for an
    // office, the same office kind in other provinces — both are the "what
    // people ask next" list.
    const siblings: OfficialPlace[] = place.kind === 'single'
        ? MISSION_PLACES.filter((p) => p.citySlug === place.citySlug && p.slug !== place.slug).slice(0, 24)
        : PLACE_CITIES
            .filter((c) => c.slug !== place.citySlug)
            .map((c) => officePlace(place.officeKindId!, c.slug))
            .filter((p): p is OfficialPlace => Boolean(p));

    // Other office kinds in the same city — the natural "while you're here".
    const alsoInCity: OfficialPlace[] = OFFICE_KINDS
        .filter((k) => k.id !== place.officeKindId)
        .map((k) => officePlace(k.id, place.citySlug))
        .filter((p): p is OfficialPlace => Boolean(p))
        .slice(0, 10);

    const jsonLd = [
        {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: place.ar,
            description: place.what,
            url: pageUrl,
            inLanguage: 'ar',
            isPartOf: { '@type': 'WebSite', name: 'دليل العرب في تركيا', url: baseUrl },
            // The authoritative location lives on Google Maps, not here — we
            // point at it rather than restating an address we do not maintain.
            mainEntity: {
                '@type': 'Place',
                name: place.ar,
                alternateName: place.tr,
                address: { '@type': 'PostalAddress', addressLocality: place.cityTr, addressCountry: 'TR' },
                hasMap: mapUrl,
            },
        },
        {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
        },
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: baseUrl },
                { '@type': 'ListItem', position: 2, name: 'المقرات الرسمية', item: `${baseUrl}/places` },
                { '@type': 'ListItem', position: 3, name: place.ar, item: pageUrl },
            ],
        },
    ];

    const Icon = place.icon;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo flex flex-col">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <PageHero
                title={place.ar}
                description={place.kind === 'single'
                    ? `الموقع على خرائط جوجل، الاتجاهات من مكانك، والمعاملات التي تُنجز هنا`
                    : `أقرب ${place.shortAr} إليك في ${place.cityAr} — الموقع والاتجاهات وحجز الموعد`}
                icon={place.flag
                    ? <span aria-hidden="true" className="text-4xl md:text-5xl">{place.flag}</span>
                    : <Icon className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
            />

            <main className="flex-grow py-8 px-4">
                <div className="container mx-auto max-w-2xl space-y-6">

                    {/* Turkish name — so the visitor can match the signage on the building */}
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                        الاسم الرسمي بالتركية:{' '}
                        <strong className="text-slate-700 dark:text-slate-200" dir="ltr" lang="tr">{place.tr}</strong>
                    </p>

                    {/* ── THE ACTION ───────────────────────────────────────── */}
                    <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-7 text-center">
                        <span aria-hidden="true" className="absolute inset-y-0 start-0 w-1 bg-emerald-500" />

                        <a
                            href={mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-base md:text-lg font-bold px-8 py-3.5 rounded-xl shadow-md shadow-emerald-600/20 transition-colors"
                        >
                            <MapPin className="w-5 h-5" />
                            <span>افتح الموقع على خرائط جوجل</span>
                        </a>

                        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {place.kind === 'single'
                                ? 'يفتح بطاقة المكان على خرائط جوجل: الموقع الحالي، العنوان، رقم الهاتف، وساعات العمل.'
                                : `يفتح فروع ${place.shortAr} في ${place.cityAr} مرتّبة من الأقرب إليك — اسمح بالوصول لموقعك لأدقّ نتيجة.`}
                        </p>

                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-center gap-3">
                            <a
                                href={dirUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-sm font-black px-4 py-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                            >
                                <Navigation className="w-4 h-4" />
                                ابدأ الاتجاهات من موقعي
                            </a>
                            {place.officialUrl && (
                                <a
                                    href={place.officialUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-sm font-black text-slate-600 dark:text-slate-300 hover:underline"
                                >
                                    <ShieldCheck className="w-4 h-4" />
                                    الموقع الرسمي
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            )}
                        </div>

                        {place.appointment && (
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <a
                                    href={place.appointment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm font-black text-blue-700 dark:text-blue-400 hover:underline"
                                >
                                    <CalendarClock className="w-4 h-4" />
                                    {place.appointment.label}
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                                    احجز موعدك قبل التوجّه — المراجعة بدون موعد قد تُرفض.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ── ماذا تنجز هنا ───────────────────────────────────── */}
                    <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <span aria-hidden="true" className="absolute inset-y-0 start-0 w-1 bg-blue-500" />
                        <h2 className="text-base font-black text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                <Info size={16} />
                            </span>
                            ماذا تنجز في {place.shortAr}؟
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{place.what}</p>
                        {group && (
                            <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                                القسم: {group.ar} — {group.subtitle}
                            </p>
                        )}
                    </div>

                    {/* ── تنبيه الدقة ─────────────────────────────────────── */}
                    <div className="relative overflow-hidden bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900/50 p-5">
                        <span aria-hidden="true" className="absolute inset-y-0 start-0 w-1 bg-amber-500" />
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                                نحن لا نخزّن عنواناً ثابتاً لهذا المقر. الرابط أعلاه يفتح <strong>بحثاً حياً</strong> في
                                خرائط جوجل باسمه الرسمي، فتظهر لك المعلومات كما هي اليوم. ومع ذلك تبقى بيانات
                                الخرائط من مصدر خارجي — اتصل بالرقم المعروض هناك قبل التوجّه، خصوصاً في العطل
                                الرسمية أو إن كان المشوار طويلاً.
                            </p>
                        </div>
                    </div>

                    {/* ── FAQ ─────────────────────────────────────────────── */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <h2 className="text-base font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                                <HelpCircle size={16} />
                            </span>
                            أسئلة شائعة — {place.ar}
                        </h2>
                        <div className="space-y-3">
                            {faqs.map((f) => (
                                <details key={f.q} className="group border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                    <summary className="flex items-center justify-between gap-3 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors list-none [&::-webkit-details-marker]:hidden">
                                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 text-start">{f.q}</h3>
                                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 group-open:rotate-180" />
                                    </summary>
                                    <div className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                                        {f.a}
                                    </div>
                                </details>
                            ))}
                        </div>
                    </div>

                    {/* ── دوائر أخرى في نفس الولاية ───────────────────────── */}
                    {place.kind === 'nearby' && alsoInCity.length > 0 && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                            <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                                <Building2 size={15} className="text-blue-600 dark:text-blue-400" />
                                دوائر أخرى في {place.cityAr}
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {alsoInCity.map((p) => (
                                    <Link
                                        key={p.slug}
                                        href={`/places/${p.slug}`}
                                        className="text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1.5 hover:border-blue-300 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                                    >
                                        {p.shortAr}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── نفس المقر/الدائرة في أماكن أخرى ─────────────────── */}
                    {siblings.length > 0 && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                            <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                                <Landmark size={15} className="text-emerald-600 dark:text-emerald-400" />
                                {place.kind === 'single'
                                    ? `سفارات وقنصليات أخرى في ${place.cityAr}`
                                    : `${place.shortAr} في ولايات أخرى`}
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {siblings.map((p) => (
                                    <Link
                                        key={p.slug}
                                        href={`/places/${p.slug}`}
                                        className="text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1.5 hover:border-emerald-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                                    >
                                        {place.kind === 'single' ? `${p.flag ?? ''} ${p.shortAr}` : p.cityAr}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Share + back ────────────────────────────────────── */}
                    <div className="flex flex-wrap justify-center gap-3 pt-2">
                        <ShareMenu
                            title={`${place.ar} — الموقع على الخريطة`}
                            text={`موقع ${place.ar} على خرائط جوجل مباشرة.`}
                            url={pageUrl}
                            variant="subtle"
                        />
                    </div>

                    <div className="flex flex-wrap justify-center gap-3">
                        {city && (
                            <Link
                                href={`/city/${city.slug}`}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-black px-4 py-2.5 hover:border-emerald-300 transition-colors"
                            >
                                <MapPin size={16} /> دليل {city.ar} الشامل
                            </Link>
                        )}
                        <Link
                            href="/places"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-black px-4 py-2.5 hover:border-emerald-300 transition-colors"
                        >
                            <ArrowLeft size={16} /> كل المقرات الرسمية في تركيا
                        </Link>
                    </div>

                </div>
            </main>
        </div>
    );
}
