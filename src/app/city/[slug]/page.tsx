import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
    MapPin, Briefcase, ShieldAlert, ArrowLeft, Building2, FileText,
    BadgeCheck, Landmark, ExternalLink, Home, CalendarClock,
    Pill, AlertTriangle, IdCard,
} from 'lucide-react';
import PageHero from '@/components/PageHero';
import Breadcrumb from '@/components/ui/Breadcrumb';
import ProviderAvatar from '@/components/services/ProviderAvatar';
import CrossLinks from '@/components/seo/CrossLinks';
import { SITE_CONFIG, getOgImage } from '@/lib/config';
import { supabase } from '@/lib/supabaseClient';
import { TR_CITIES, cityBySlug, canonicalCity } from '@/lib/turkishCities';
import { pharmacyCityBySlug } from '@/lib/pharmacyCities';
import closedAreas from '../../../../public/data/closed-areas.json';

export const revalidate = 3600;
export const dynamicParams = true;

export function generateStaticParams() {
    return TR_CITIES.map((c) => ({ slug: c.slug }));
}

type Provider = {
    id: string; slug: string | null; name: string; profession: string | null;
    city: string | null; image: string | null; is_verified: boolean | null; rating: number | null;
};

async function getCityData(slug: string) {
    const city = cityBySlug(slug);
    if (!city) return null;

    // Providers in this city (small table → fetch approved, filter in-memory by canonical city).
    let providers: Provider[] = [];
    if (supabase) {
        try {
            const { data } = await supabase
                .from('service_providers')
                .select('id, slug, name, profession, city, image, is_verified, rating')
                .eq('status', 'approved')
                .order('is_verified', { ascending: false })
                .order('rating', { ascending: false })
                .limit(500);
            providers = ((data as Provider[]) || []).filter((p) => canonicalCity(p.city) === city.ar);
        } catch { /* graceful */ }
    }

    // Closed-neighbourhood zones in this city (static asset → zero egress).
    const zones = (closedAreas as { items?: { c: string; d: string; n: string }[] }).items || [];
    const cityZones = zones.filter((z) => canonicalCity(z.c) === city.ar);
    const districts = Array.from(new Set(cityZones.map((z) => z.d).filter(Boolean)));

    // City-relevant articles — surface the existing 300+ article base for local
    // relevance + internal link equity. Match the city's Arabic name in title.
    let cityArticles: { slug: string | null; title: string }[] = [];
    if (supabase) {
        try {
            const { data } = await supabase
                .from('articles')
                .select('slug, title')
                .eq('status', 'approved')
                .ilike('title', `%${city.ar}%`)
                .order('published_at', { ascending: false })
                .limit(8);
            cityArticles = (data as { slug: string | null; title: string }[]) || [];
        } catch { /* graceful */ }
    }

    // Kimlik + residence pages — every city visitor needs these, so surface the
    // core كملك/إقامة guides for internal-link equity and topical depth.
    let residenceArticles: { slug: string | null; title: string }[] = [];
    if (supabase) {
        try {
            const { data } = await supabase
                .from('articles')
                .select('slug, title')
                .eq('status', 'approved')
                .or('title.ilike.%كملك%,title.ilike.%الإقامة%,title.ilike.%الحماية المؤقتة%,title.ilike.%تصريح الإقامة%')
                .order('published_at', { ascending: false })
                .limit(6);
            residenceArticles = (data as { slug: string | null; title: string }[]) || [];
        } catch { /* graceful */ }
    }

    return { city, providers, closedCount: cityZones.length, districts, cityArticles, residenceArticles };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const city = cityBySlug(slug);
    if (!city) return { title: 'مدينة غير معروفة', robots: { index: false } };
    const title = `دليل العرب والسوريين في ${city.ar} 2026 — الخدمات، الإقامة، الأحياء المغلقة`;
    const description = `كل ما يحتاجه العرب في ${city.ar}: مقدّمو خدمات عرب، حالة الأحياء المغلقة لتسجيل الأجانب، وأدلّة الإقامة والعمل والأوراق الرسمية — محدّث 2026.`;
    return {
        title: { absolute: `${title} | دليل العرب في تركيا` },
        description,
        alternates: { canonical: `/city/${slug}` },
        openGraph: {
            title, description,
            url: `${SITE_CONFIG.siteUrl}/city/${slug}`,
            images: [{ url: getOgImage(undefined, { title: `دليل العرب في ${city.ar}` }), width: 1200, height: 630, alt: `دليل العرب في ${city.ar}` }],
        },
    };
}

export default async function CityHubPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const data = await getCityData(slug);
    if (!data) notFound();
    const { city, providers, closedCount, districts, cityArticles, residenceArticles } = data;
    const base = SITE_CONFIG.siteUrl;
    const topProviders = providers.slice(0, 8);

    const faqs = [
        { q: `كم عدد الأحياء المغلقة لتسجيل الأجانب في ${city.ar}؟`, a: closedCount > 0 ? `يوجد ${closedCount} حيّاً مغلقاً أمام تسجيل الأجانب في ${city.ar}، موزّعة على ${districts.length} منطقة. تحقّق دائماً أن الحيّ مفتوح قبل استئجار أو شراء سكن.` : `لا توجد أحياء مغلقة مسجّلة حالياً في ${city.ar} في قائمتنا. تحقّق دائماً قبل التسجيل.` },
        { q: `كم عدد مقدّمي الخدمات العرب في ${city.ar}؟`, a: providers.length > 0 ? `يضمّ دليل العرب ${providers.length} مقدّم خدمة عربيّ مدرج في ${city.ar} — أطباء ومحامون ومترجمون وعقارات وغيرها، مع تواصل مباشر عبر واتساب. تظهر شارة التحقق فقط لمن راجعت الإدارة بيانات تواصله الأساسية.` : `لا يوجد مقدّمو خدمات مسجّلون في ${city.ar} بعد — يمكن إضافة الخدمات مجاناً.` },
        { q: `أين أجد صيدلية مناوبة في ${city.ar} الآن؟`, a: `استخدم أداة الصيدليات المناوبة في دليل العرب أو بوابة e-Devlet الرسمية، واختر ولاية ${city.ar} لعرض الصيدليات المفتوحة حالياً على مدار الساعة (nöbetçi eczane).` },
        { q: `أين مديرية الهجرة والنفوس في ${city.ar}؟`, a: `لمعاملات الإقامة والكملك: راجع مديرية الهجرة (Göç İdaresi) بولاية ${city.ar} بعد حجز موعد عبر randevu.goc.gov.tr. ولمعاملات النفوس (الهوية ودفتر العائلة): مديرية النفوس (Nüfus Müdürlüğü) أو بوابة nvi.gov.tr.` },
        { q: `كيف أحجز موعد الإقامة (Randevu) في ${city.ar}؟`, a: `عبر بوابة دائرة الهجرة الرسمية randevu.goc.gov.tr — اختر ولاية ${city.ar} ونوع المعاملة ثم احجز أقرب موعد متاح.` },
        { q: `كيف أعرف إن كان الحيّ مفتوحاً لتسجيل الأجانب في ${city.ar}؟`, a: `استخدم أداة فحص الأحياء المغلقة في دليل العرب، أو استعلم رسمياً من دائرة الهجرة قبل توقيع عقد السكن.` },
    ];

    const localWarnings = [
        closedCount > 0
            ? `احذر توقيع عقد سكن في أحد الأحياء الـ${closedCount} المغلقة لتسجيل الأجانب في ${city.ar} — لن تستطيع تسجيل عنوانك (Adres) ولا استكمال معاملة الإقامة. تحقّق من الحيّ أولاً.`
            : `تحقّق دائماً أن الحيّ مفتوح لتسجيل الأجانب في ${city.ar} قبل توقيع عقد السكن — التسجيل في حيّ مغلق يعطّل معاملة الإقامة.`,
        `لا تدفع أي مبلغ لسمسار أو مكتب «معقّب» في ${city.ar} قبل رؤية الخدمة والاتفاق الموثّق — كثير من عمليات النصب تبدأ بدفعة مقدّمة ثم انقطاع.`,
        `انتحال الصفة: لا جهة رسمية — ولا «دليل العرب» — تطلب رقم كملكك الكامل أو صور جوازك/إقامتك عبر الهاتف أو الرسائل. أي طلب كهذا احتيال.`,
        `مواعيد الإقامة الرسمية في ${city.ar} تُحجز مجاناً عبر randevu.goc.gov.tr فقط — احذر من يبيعك «موعداً» مقابل مال.`,
    ];

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: base },
                    { '@type': 'ListItem', position: 2, name: 'دليل المدن', item: `${base}/city` },
                    { '@type': 'ListItem', position: 3, name: city.ar, item: `${base}/city/${slug}` },
                ],
            },
            {
                '@type': 'CollectionPage',
                name: `دليل العرب والسوريين في ${city.ar}`,
                url: `${base}/city/${slug}`,
                inLanguage: 'ar',
                about: { '@type': 'City', name: city.ar, address: { '@type': 'PostalAddress', addressCountry: 'TR' } },
                isPartOf: { '@type': 'WebSite', name: SITE_CONFIG.name, url: base },
            },
            {
                '@type': 'FAQPage',
                mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
            },
        ],
    };

    const guides = [
        { href: '/category/residence', title: 'الإقامة والأوراق', icon: FileText, desc: 'تصاريح الإقامة، الكملك، التجديد' },
        { href: '/category/work', title: 'العمل والاستثمار', icon: Briefcase, desc: 'إذن العمل، الشركات، الضرائب' },
        { href: '/consultant', title: 'دليل المواقف', icon: Building2, desc: 'حدّد إجراءك خطوة بخطوة' },
        { href: '/tools/residence-calculator', title: 'حاسبة أيام الإقامة', icon: CalendarClock, desc: 'تابع شرط الإقامة المتّصلة' },
    ];

    return (
        <main className="flex flex-col min-h-screen font-cairo bg-slate-50 dark:bg-slate-950" dir="rtl">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <div className="max-w-6xl mx-auto w-full px-4 pt-4">
                <Breadcrumb items={[{ label: 'دليل المدن', href: '/city' }, { label: city.ar }]} />
            </div>

            <PageHero
                title={`دليل العرب والسوريين في ${city.ar}`}
                description={`مقدّمو خدمات عرب، حالة الأحياء المغلقة، وأدلّة الإقامة والعمل في ${city.ar}.`}
                icon={<MapPin className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
                titleClassName="md:text-4xl"
            />

            <div className="max-w-6xl mx-auto w-full px-4 py-10 space-y-12">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-center">
                        <Briefcase size={18} className="mx-auto mb-2 text-emerald-600" />
                        <div className="text-2xl font-black text-slate-900 dark:text-slate-50 tabular-nums">{providers.length}</div>
                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">مقدّم خدمة عربي</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-center">
                        <ShieldAlert size={18} className="mx-auto mb-2 text-amber-500" />
                        <div className="text-2xl font-black text-slate-900 dark:text-slate-50 tabular-nums">{closedCount}</div>
                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">حيّ مغلق للتسجيل</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-center col-span-2 md:col-span-1">
                        <Landmark size={18} className="mx-auto mb-2 text-blue-500" />
                        <div className="text-2xl font-black text-slate-900 dark:text-slate-50 tabular-nums">{districts.length}</div>
                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">منطقة بها أحياء مغلقة</div>
                    </div>
                </div>

                {/* Services */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <Briefcase size={20} className="text-emerald-600" /> خدمات ومهنيّون عرب في {city.ar}
                        </h2>
                        <Link href={`/services?city=${encodeURIComponent(city.ar)}`} className="text-sm font-black text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 hover:gap-2 transition-all">
                            الكل <ArrowLeft size={15} />
                        </Link>
                    </div>
                    {topProviders.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {topProviders.map((p) => (
                                <Link key={p.id} href={`/services/${p.slug || p.id}`}
                                    className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all">
                                    <ProviderAvatar name={p.name} image={p.image} className="w-12 h-12 rounded-xl shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="font-black text-sm text-slate-900 dark:text-slate-100 line-clamp-1 flex items-center gap-1">
                                            {p.name}
                                            {p.is_verified && <BadgeCheck size={14} className="text-blue-500 shrink-0" />}
                                        </p>
                                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 line-clamp-1">{p.profession}</p>
                                    </div>
                                    <ArrowLeft size={16} className="text-slate-300 dark:text-slate-600 shrink-0" />
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 text-center">
                            <p className="text-sm text-slate-500 dark:text-slate-400">لا يوجد مقدّمو خدمات مسجّلون في {city.ar} بعد.</p>
                            <Link href="/join" className="inline-flex items-center gap-1.5 mt-3 text-sm font-black text-emerald-600 dark:text-emerald-400">
                                أضف خدمتك مجاناً <ArrowLeft size={15} />
                            </Link>
                        </div>
                    )}
                </section>

                {/* Zones */}
                <section>
                    <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
                        <ShieldAlert size={20} className="text-amber-500" /> الأحياء المغلقة لتسجيل الأجانب في {city.ar}
                    </h2>
                    <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20 p-5">
                        {closedCount > 0 ? (
                            <>
                                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed mb-3">
                                    يوجد <strong className="tabular-nums">{closedCount}</strong> حيّاً مغلقاً أمام تسجيل الأجانب في {city.ar} (موزّعة على {districts.length} منطقة).
                                    قبل استئجار أو شراء سكن، تحقّق أن الحيّ مفتوح للتسجيل.
                                </p>
                                {districts.length > 0 && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                                        مناطق بها أحياء مغلقة: {districts.slice(0, 12).join('، ')}{districts.length > 12 ? ' …' : ''}
                                    </p>
                                )}
                            </>
                        ) : (
                            <p className="text-sm text-slate-700 dark:text-slate-200 mb-4">لا توجد أحياء مغلقة مسجّلة حالياً في {city.ar} في قائمتنا — تحقّق دائماً قبل التسجيل.</p>
                        )}
                        <Link href="/zones" className="inline-flex items-center gap-1.5 text-sm font-black text-amber-700 dark:text-amber-300">
                            افحص أي حيّ في تركيا <ArrowLeft size={15} />
                        </Link>
                    </div>
                </section>

                {/* Pharmacies on duty */}
                <section>
                    <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
                        <Pill size={20} className="text-green-600" /> الصيدليات المناوبة في {city.ar}
                    </h2>
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed mb-4">
                            لمعرفة أقرب صيدلية مناوبة (nöbetçi eczane) مفتوحة الآن في {city.ar} على مدار الساعة، افتح الأداة واختر ولاية {city.ar} — تعرض القائمة الرسمية المحدّثة يومياً مع العناوين وأرقام الهاتف.
                        </p>
                        <div className="flex flex-wrap gap-2.5">
                            <Link href={pharmacyCityBySlug(slug) ? `/tools/pharmacy/${slug}` : '/tools/pharmacy'} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black px-4 py-2.5 transition-colors">
                                <Pill size={16} /> صيدليات {city.ar} المناوبة الآن
                            </Link>
                            <a href="https://www.turkiye.gov.tr/saglik-titck-nobetci-eczane-sorgulama" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-black px-4 py-2.5 hover:border-emerald-300 transition-colors">
                                <ExternalLink size={15} /> القائمة الرسمية (e-Devlet)
                            </a>
                        </div>
                    </div>
                </section>

                {/* Local warnings */}
                <section>
                    <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
                        <AlertTriangle size={20} className="text-red-500" /> تحذيرات محلية تهمّك في {city.ar}
                    </h2>
                    <ul className="space-y-2.5">
                        {localWarnings.map((w, i) => (
                            <li key={i} className="flex items-start gap-3 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50/60 dark:bg-red-950/20 p-4">
                                <AlertTriangle size={17} className="text-red-500 shrink-0 mt-0.5" />
                                <span className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{w}</span>
                            </li>
                        ))}
                    </ul>
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                        تعرّضت لمحاولة نصب في {city.ar}؟ راجع{' '}
                        <Link href="/codes" className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">الأكواد الأمنية</Link>
                        {' '}و<Link href="/consultant" className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">دليل المواقف</Link>.
                    </p>
                </section>

                {/* Guides */}
                <section>
                    <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
                        <FileText size={20} className="text-emerald-600" /> أدلّة وإجراءات تهمّ العرب في {city.ar}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {guides.map((g) => (
                            <Link key={g.href} href={g.href}
                                className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all">
                                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 shrink-0">
                                    <g.icon size={20} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-black text-sm text-slate-900 dark:text-slate-100">{g.title}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{g.desc}</p>
                                </div>
                                <ArrowLeft size={16} className="text-slate-300 dark:text-slate-600 shrink-0" />
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Immigration + civil registry + official links */}
                <section>
                    <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
                        <Landmark size={20} className="text-blue-500" /> الهجرة والنفوس والروابط الرسمية في {city.ar}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            { href: 'https://randevu.goc.gov.tr/', label: 'حجز موعد الإقامة (Randevu)', note: `اختر ولاية ${city.ar} ثم نوع المعاملة` },
                            { href: 'https://www.goc.gov.tr/', label: 'دائرة الهجرة (Göç İdaresi)', note: 'شؤون الإقامة والحماية المؤقتة' },
                            { href: 'https://www.nvi.gov.tr/', label: 'مديرية النفوس والمواطنة (NVİ)', note: 'الهوية، دفتر العائلة، الكملك' },
                            { href: 'https://www.turkiye.gov.tr/', label: 'الحكومة الإلكترونية (e-Devlet)', note: 'الخدمات الرسمية وتسجيل العنوان (Adres)' },
                            { href: '/important-links', label: 'كل الروابط والمنظمات', note: 'مصادر موثوقة إضافية', internal: true },
                        ].map((l) => (
                            l.internal ? (
                                <Link key={l.href} href={l.href} className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-blue-300 transition-all">
                                    <Home size={18} className="text-blue-500 shrink-0" />
                                    <div className="min-w-0 flex-1"><p className="font-black text-sm text-slate-900 dark:text-slate-100">{l.label}</p><p className="text-xs text-slate-500 dark:text-slate-400">{l.note}</p></div>
                                    <ArrowLeft size={15} className="text-slate-300 shrink-0" />
                                </Link>
                            ) : (
                                <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-blue-300 transition-all">
                                    <ExternalLink size={18} className="text-blue-500 shrink-0" />
                                    <div className="min-w-0 flex-1"><p className="font-black text-sm text-slate-900 dark:text-slate-100">{l.label}</p><p className="text-xs text-slate-500 dark:text-slate-400">{l.note}</p></div>
                                </a>
                            )
                        ))}
                    </div>
                </section>

                {/* Kimlik + residence pages relevant to every city visitor */}
                {residenceArticles.length > 0 && (
                    <section>
                        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
                            <IdCard size={20} className="text-blue-500" /> صفحات مرتبطة بالكملك والإقامة
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {residenceArticles.map((a) => (
                                <Link key={a.slug} href={`/article/${a.slug}`}
                                    className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all">
                                    <IdCard size={18} className="text-blue-500 shrink-0" />
                                    <span className="font-bold text-sm text-slate-800 dark:text-slate-100 line-clamp-2 flex-1">{a.title}</span>
                                    <ArrowLeft size={16} className="text-slate-300 dark:text-slate-600 shrink-0" />
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* City-relevant articles — leverages the existing article base */}
                {cityArticles.length > 0 && (
                    <section>
                        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
                            <FileText size={20} className="text-emerald-600" /> أخبار وأدلّة تخصّ {city.ar}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {cityArticles.map((a) => (
                                <Link key={a.slug} href={`/article/${a.slug}`}
                                    className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all">
                                    <FileText size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    <span className="font-bold text-sm text-slate-800 dark:text-slate-100 line-clamp-2 flex-1">{a.title}</span>
                                    <ArrowLeft size={16} className="text-slate-300 dark:text-slate-600 shrink-0" />
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* City FAQ — also emitted as FAQPage structured data above */}
                <section>
                    <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
                        <MapPin size={20} className="text-emerald-600" /> أسئلة شائعة عن {city.ar}
                    </h2>
                    <div className="space-y-3">
                        {faqs.map((f, i) => (
                            <details key={i} className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                                <summary className="font-black text-sm text-slate-900 dark:text-slate-100 cursor-pointer list-none flex items-center justify-between gap-2">
                                    {f.q}
                                    <span className="text-slate-400 group-open:rotate-45 transition-transform text-lg leading-none shrink-0">+</span>
                                </summary>
                                <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">{f.a}</p>
                            </details>
                        ))}
                    </div>
                </section>

                {/* Other cities */}
                <section>
                    <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-3">مدن أخرى</h2>
                    <div className="flex flex-wrap gap-2">
                        {TR_CITIES.filter((c) => c.slug !== slug).map((c) => (
                            <Link key={c.slug} href={`/city/${c.slug}`}
                                className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 hover:border-emerald-300 hover:text-emerald-600 transition-colors">
                                {c.ar}
                            </Link>
                        ))}
                    </div>
                </section>

                <CrossLinks context="zone" />
            </div>
        </main>
    );
}
