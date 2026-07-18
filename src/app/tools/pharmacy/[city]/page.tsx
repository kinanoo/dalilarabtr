import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
    HeartPulse, ExternalLink, ShieldCheck, MapPin, ArrowLeft, Phone,
    Info, Clock, ChevronDown, HelpCircle, Building2, Landmark,
} from 'lucide-react';
import PageHero from '@/components/PageHero';
import ToolFooter from '@/components/tools/ToolFooter';
import { SITE_CONFIG } from '@/lib/config';
import {
    PHARMACY_CITIES, pharmacyCityBySlug, dutyMapUrl, OFFICIAL_EDEVLET_PHARMACY,
} from '@/lib/pharmacyCities';

// The data is a compile-time constant and every action is an outbound link
// (map / official chamber / e-Devlet). ISR + dynamicParams=true (not
// force-static + dynamicParams=false) because that's the only prerendered
// dynamic-route shape @opennextjs/cloudflare actually serves on Workers —
// /city/[slug] proved it; the force-static variant 404s in production.
export const revalidate = 86400;
export const dynamicParams = true;

export function generateStaticParams() {
    return PHARMACY_CITIES.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
    const { city: slug } = await params;
    const city = pharmacyCityBySlug(slug);
    if (!city) return {};
    const districts = city.districts.slice(0, 4).map((d) => d.ar).join('، ');
    return {
        title: `الصيدلية المناوبة في ${city.ar} اليوم — أقرب صيدلية مفتوحة الآن (Nöbetçi Eczane ${city.tr})`,
        description: `اعثر فوراً على الصيدلية المناوبة المفتوحة الآن في ${city.ar} (${districts}...) — خريطة مباشرة لأقرب صيدلية، ${city.odaUrl ? 'القائمة الرسمية اليومية من غرفة الصيادلة بالعناوين وأرقام الهاتف، ' : ''}ورابط e-Devlet الرسمي. بدون تسجيل.`,
        keywords: `صيدلية مناوبة ${city.ar}, الصيدلية المناوبة في ${city.ar}, الصيدلية المناوبة في ${city.ar} اليوم, الصيدليات المناوبة في ${city.ar}, أقرب صيدلية مناوبة من موقعي الآن ${city.ar}, صيدلية مفتوحة الآن ${city.ar}, Nöbetçi Eczane ${city.tr}`,
        alternates: { canonical: `/tools/pharmacy/${city.slug}` },
        openGraph: {
            title: `الصيدلية المناوبة في ${city.ar} اليوم — أقرب صيدلية مفتوحة الآن`,
            description: `خريطة مباشرة + القائمة الرسمية للصيدليات المناوبة في ${city.ar} محدّثة يومياً.`,
            url: `${SITE_CONFIG.siteUrl}/tools/pharmacy/${city.slug}`,
            images: ['/og-banner.jpg'],
        },
    };
}

export default async function PharmacyCityPage({ params }: { params: Promise<{ city: string }> }) {
    const { city: slug } = await params;
    const city = pharmacyCityBySlug(slug);
    if (!city) notFound();

    const baseUrl = SITE_CONFIG.siteUrl;
    const pageUrl = `${baseUrl}/tools/pharmacy/${city.slug}`;

    const faqs = [
        {
            q: `كيف أعرف الصيدلية المناوبة في ${city.ar} الآن؟`,
            a: `الأسرع: افتح خريطة الصيدليات المناوبة في ${city.ar} من الزر أعلى الصفحة لتشاهد أقرب صيدلية مفتوحة حالياً. ${city.odaUrl ? `وللقائمة الرسمية المعتمدة بالأسماء والعناوين وأرقام الهاتف، افتح صفحة ${city.odaName} — تُحدَّث يومياً.` : 'وللقائمة الرسمية المعتمدة، استخدم خدمة e-Devlet واختر الولاية ثم المنطقة.'}`,
        },
        {
            q: `ما هي ساعات عمل الصيدلية المناوبة في ${city.ar}؟`,
            a: 'الصيدلية المناوبة (Nöbetçi Eczane) تخدم خارج ساعات الدوام العادي: طوال الليل وفي أيام الأحد والعطل الرسمية. المناوبة تتبدل يومياً بالتناوب بين صيدليات المنطقة، لذلك تحقق من قائمة اليوم قبل التوجه.',
        },
        {
            q: `هل أحتاج حساباً أو تسجيل دخول لمعرفة الصيدلية المناوبة في ${city.ar}؟`,
            a: 'لا. الخريطة وقائمة غرفة الصيادلة وخدمة e-Devlet للصيدليات المناوبة كلها متاحة للجميع مجاناً وبدون أي تسجيل.',
        },
        {
            q: `ماذا أفعل في حالة طارئة صحية في ${city.ar} والصيدلية بعيدة؟`,
            a: 'اتصل برقم الطوارئ العام 112 (إسعاف) — يعمل على مدار الساعة ومجاني. ولمعلومات الأدوية والتسمم اتصل بالخط 182.',
        },
    ];

    const jsonLd = [
        {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: `الصيدلية المناوبة في ${city.ar} اليوم`,
            description: `أقرب صيدلية مناوبة مفتوحة الآن في ${city.ar} — خريطة مباشرة والقائمة الرسمية اليومية.`,
            url: pageUrl,
            inLanguage: 'ar',
            isPartOf: { '@type': 'WebSite', name: 'دليل العرب في تركيا', url: baseUrl },
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
                { '@type': 'ListItem', position: 2, name: 'الأدوات', item: `${baseUrl}/tools` },
                { '@type': 'ListItem', position: 3, name: 'الصيدليات المناوبة', item: `${baseUrl}/tools/pharmacy` },
                { '@type': 'ListItem', position: 4, name: `الصيدلية المناوبة في ${city.ar}`, item: pageUrl },
            ],
        },
    ];

    const siblings = PHARMACY_CITIES.filter((c) => c.slug !== city.slug);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo flex flex-col">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <PageHero
                title={`الصيدلية المناوبة في ${city.ar} اليوم`}
                description={`أقرب صيدلية مناوبة (Nöbetçi Eczane) مفتوحة الآن في ${city.ar} — خريطة مباشرة، القائمة الرسمية اليومية، وأرقام الطوارئ`}
                icon={<HeartPulse className="w-10 h-10 md:w-12 md:h-12 text-red-500" />}
            />

            <main className="flex-grow py-10 px-4">
                <div className="container mx-auto max-w-2xl">

                    {/* Intro — unique per city, indexable */}
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5 text-center">
                        الصيدلية المناوبة في {city.ar} هي الصيدلية المفتوحة خارج ساعات الدوام والليل والعطل، وتتبدل يومياً بالتناوب
                        بين مناطق الولاية{city.districts.length ? ` (${city.districts.slice(0, 4).map((d) => d.ar).join('، ')}...)` : ''}.
                        افتحها على الخريطة قرب موقعك الآن، أو راجع القائمة الرسمية اليومية.
                    </p>

                    {/* Primary actions */}
                    <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-7 text-center">
                        <span aria-hidden="true" className="absolute inset-y-0 start-0 w-1 bg-emerald-500" />
                        <a
                            href={dutyMapUrl(city.tr)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-base md:text-lg font-bold px-8 py-3.5 rounded-xl shadow-md shadow-emerald-600/20 transition-colors"
                        >
                            <MapPin className="w-5 h-5" />
                            <span>خريطة الصيدليات المناوبة في {city.ar} الآن</span>
                        </a>
                        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">تفتح خريطة مباشرة بأقرب الصيدليات المناوبة — اسمح بالوصول لموقعك لأدقّ نتيجة.</p>

                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                            {city.odaUrl && (
                                <div>
                                    <a
                                        href={city.odaUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                                    >
                                        <Landmark className="w-4 h-4" />
                                        قائمة اليوم الرسمية — {city.odaName}
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">القائمة المعتمدة من غرفة الصيادلة: أسماء الصيدليات المناوبة اليوم بالعناوين وأرقام الهاتف.</p>
                                </div>
                            )}
                            <div>
                                <a
                                    href={OFFICIAL_EDEVLET_PHARMACY}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:underline"
                                >
                                    <ShieldCheck className="w-4 h-4" />
                                    الاستعلام الحكومي عبر e-Devlet
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> المناوبة تتبدل يومياً</span>
                                <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> بدون تسجيل دخول</span>
                            </div>
                        </div>
                    </div>

                    {/* Districts — per-district live map links */}
                    <div className="relative overflow-hidden mt-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <span aria-hidden="true" className="absolute inset-y-0 start-0 w-1 bg-emerald-500" />
                        <h2 className="text-base font-black text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                                <Building2 size={16} />
                            </span>
                            الصيدلية المناوبة حسب المنطقة في {city.ar}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">اختر منطقتك لعرض الصيدليات المناوبة القريبة عليها على الخريطة الآن.</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {city.districts.map((d) => (
                                <a
                                    key={d.tr}
                                    href={dutyMapUrl(`${d.tr} ${city.tr}`)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm transition-all"
                                >
                                    <MapPin size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{d.ar}</span>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* How to */}
                    <div className="relative overflow-hidden mt-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <span aria-hidden="true" className="absolute inset-y-0 start-0 w-1 bg-blue-500" />
                        <h2 className="text-base font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                <Info size={16} />
                            </span>
                            كيف تصل لأقرب صيدلية مناوبة في {city.ar}؟
                        </h2>
                        <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-300 list-decimal list-inside leading-relaxed">
                            <li>الأسرع: افتح «خريطة الصيدليات المناوبة في {city.ar}» وستظهر الصيدليات المفتوحة الآن الأقرب إليك.</li>
                            {city.odaUrl
                                ? <li>للتأكد بالاسم والعنوان ورقم الهاتف: راجع قائمة اليوم الرسمية من {city.odaName} — تُحدَّث كل يوم.</li>
                                : <li>للقائمة الرسمية: افتح خدمة e-Devlet واختر ولاية {city.ar} ثم منطقتك لتظهر القائمة بالعناوين والهواتف.</li>}
                            <li>اتصل بالصيدلية قبل التوجه إذا كانت المسافة بعيدة، أو تحقق من منطقتك في القائمة أعلاه.</li>
                        </ol>
                    </div>

                    {/* Emergency numbers */}
                    <div className="relative overflow-hidden mt-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <span aria-hidden="true" className="absolute inset-y-0 start-0 w-1 bg-red-500" />
                        <h2 className="text-base font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                                <Phone size={16} />
                            </span>
                            أرقام الطوارئ في تركيا
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { number: '112', label: 'الطوارئ العامة (Acil)' },
                                { number: '155', label: 'الشرطة (Polis)' },
                                { number: '110', label: 'الإطفاء (İtfaiye)' },
                                { number: '182', label: 'خط الأدوية والتسمم' },
                            ].map((item) => (
                                <a
                                    key={item.number}
                                    href={`tel:${item.number}`}
                                    className="flex items-center gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-700 hover:shadow-md hover:-translate-y-0.5 transition-all"
                                >
                                    <span className="text-lg font-black text-red-600 dark:text-red-400 font-mono tabular-nums" dir="ltr">{item.number}</span>
                                    <span className="text-xs text-slate-600 dark:text-slate-300 font-bold leading-tight">{item.label}</span>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* FAQ — visible + schema above */}
                    <div className="mt-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <h2 className="text-base font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                                <HelpCircle size={16} />
                            </span>
                            أسئلة شائعة — الصيدلية المناوبة في {city.ar}
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

                    {/* Other cities — internal mesh */}
                    <div className="mt-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-3">الصيدلية المناوبة في مدن أخرى</h2>
                        <div className="flex flex-wrap gap-2">
                            {siblings.map((c) => (
                                <Link
                                    key={c.slug}
                                    href={`/tools/pharmacy/${c.slug}`}
                                    className="text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1.5 hover:border-emerald-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                                >
                                    {c.ar}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* City hub + back link */}
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        {city.hasCityHub && (
                            <Link
                                href={`/city/${city.slug}`}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-black px-4 py-2.5 hover:border-emerald-300 transition-colors"
                            >
                                <MapPin size={16} /> دليل {city.ar} الشامل
                            </Link>
                        )}
                        <Link
                            href="/tools/pharmacy"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-black px-4 py-2.5 hover:border-emerald-300 transition-colors"
                        >
                            <ArrowLeft size={16} /> كل الصيدليات المناوبة في تركيا
                        </Link>
                    </div>

                </div>
            </main>

            <ToolFooter toolId="pharmacy" />
        </div>
    );
}
