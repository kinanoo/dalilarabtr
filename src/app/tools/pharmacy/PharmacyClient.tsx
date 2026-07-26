'use client';

import { HeartPulse, ExternalLink, ShieldCheck, MapPin, ArrowLeft, Phone, Info, ChevronDown, HelpCircle, Map as MapIcon, Building2, Languages, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import PageHero from '@/components/PageHero';
import ShareMenu from '@/components/ShareMenu';
import { SITE_CONFIG } from '@/lib/config';
import CrossLinks from '@/components/seo/CrossLinks';

// Verified 2026-07-26 by reading the page <title> ("Sağlık Bakanlığı - TİTCK -
// Nöbetçi Eczane Sorgulama"). NOTE: turkiye.gov.tr answers HTTP 200 for pages
// that do not exist — the near-miss slug `saglik-bakanligi-nobetci-eczane-
// sorgulama` is a phantom titled "404 Sayfa Bulunamadı". Never swap this URL
// without re-checking the title, not the status code.
const OFFICIAL_EDEVLET = 'https://www.turkiye.gov.tr/saglik-titck-nobetci-eczane-sorgulama';

// Major provinces most searched by Arab/Syrian residents. Slugs must match
// src/lib/pharmacyCities.ts — each links to the dedicated indexable city page
// (/tools/pharmacy/[city]) which carries the live map + the official chamber
// list for that province. Kept as a slim {slug, ar} copy so the districts
// dataset stays out of this client bundle.
const CITIES: { slug: string; ar: string }[] = [
    { slug: 'istanbul', ar: 'إسطنبول' }, { slug: 'gaziantep', ar: 'غازي عنتاب' },
    { slug: 'mersin', ar: 'مرسين' }, { slug: 'adana', ar: 'أضنة' },
    { slug: 'hatay', ar: 'هاتاي (أنطاكية)' }, { slug: 'bursa', ar: 'بورصة' },
    { slug: 'ankara', ar: 'أنقرة' }, { slug: 'izmir', ar: 'إزمير' },
    { slug: 'sanliurfa', ar: 'شانلي أورفا' }, { slug: 'konya', ar: 'قونية' },
    { slug: 'kayseri', ar: 'قيصري' }, { slug: 'kilis', ar: 'كلّس' },
    { slug: 'kahramanmaras', ar: 'كهرمان مرعش' }, { slug: 'malatya', ar: 'ملاطية' },
    { slug: 'kocaeli', ar: 'كوجالي' }, { slug: 'antalya', ar: 'أنطاليا' },
    { slug: 'mardin', ar: 'ماردين' }, { slug: 'sakarya', ar: 'سكاريا' },
    { slug: 'osmaniye', ar: 'عثمانية' },
];

// Phrases an Arabic speaker who cannot read Turkish actually needs at the
// counter or when asking a passer-by. This is the part of the page we can
// genuinely deliver ourselves — no third-party data, no permission needed.
const PHRASES: { ar: string; tr: string }[] = [
    { ar: 'أين أقرب صيدلية مناوبة؟', tr: 'En yakın nöbetçi eczane nerede?' },
    { ar: 'أحتاج دواءً، هذه وصفة الطبيب.', tr: 'İlaca ihtiyacım var, bu doktor reçetesi.' },
    { ar: 'هل هذا الدواء متوفّر بلا وصفة؟', tr: 'Bu ilaç reçetesiz var mı?' },
    { ar: 'عندي حساسية من هذا الدواء.', tr: 'Bu ilaca alerjim var.' },
    { ar: 'الدواء لطفل عمره ... سنوات.', tr: 'İlaç ... yaşında bir çocuk için.' },
    { ar: 'كم السعر؟', tr: 'Fiyatı ne kadar?' },
];

/**
 * Opens a live map of on-duty pharmacies around the user. This is a MAP, not
 * an answer — the button label and helper text say exactly that. We do not
 * hold the daily duty roster (it is per-district, changes daily, and no source
 * we can lawfully redistribute covers all 81 provinces), so we must not imply
 * that we are about to show the user "the nearest on-duty pharmacy".
 */
function openDutyMap() {
    const search = (suffix = '') => window.open(
        `https://www.google.com/maps/search/${encodeURIComponent('Nöbetçi Eczane')}${suffix}`,
        '_blank', 'noopener,noreferrer',
    );
    if (typeof navigator === 'undefined' || !navigator.geolocation) { search(); return; }
    navigator.geolocation.getCurrentPosition(
        // The `/@lat,lng,zoom` path form actually centres the map on the user;
        // the api=1 search endpoint silently ignores `&center=`.
        (pos) => search(`/@${pos.coords.latitude},${pos.coords.longitude},14z`),
        () => search(),
        { timeout: 8000 },
    );
}

/**
 * `faqs` comes from getToolFaqs('pharmacy') in the server page — the SAME array
 * that feeds the FAQPage JSON-LD. Never hardcode Q&A here: this page used to,
 * and the result was a rewrite of the visible answers that left a factual error
 * ("duty pharmacies run 24/7") alive in the structured data, which is the copy
 * Google actually reads. Google also requires the markup to match what the
 * visitor sees.
 */
export default function PharmacyPage({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo flex flex-col">

            <PageHero
                title="الصيدلية المناوبة في تركيا: كيف تجدها الآن"
                description="المناوبة تتغيّر يومياً وتختلف من منطقة لأخرى. هنا أسرع طريقتين رسميتين للوصول إليها، والعبارات التركية التي تحتاجها عند الصيدلية."
                icon={<HeartPulse className="w-10 h-10 md:w-12 md:h-12 text-red-500" />}
            />

            <main className="flex-grow py-10 px-4">
                <div className="container mx-auto max-w-2xl">

                    {/* Honest framing: we point to the official list, we are not the list. */}
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5 text-center">
                        الصيدلية المناوبة (نوبتشي إجزانه) هي الصيدلية التي تبقى مفتوحة بعد دوام باقي الصيدليات وفي العطل، وتتناوب عليها صيدليات المنطقة يوماً بيوم.
                        <strong className="text-slate-800 dark:text-slate-100"> نحن لا نحتفظ بقائمة المناوبة</strong> — نأخذك إليها من مصدرها الرسمي في خطوتين.
                    </p>

                    {/* Primary: the official list. It is the one route that returns
                        names, addresses and phone numbers — i.e. an actual answer. */}
                    <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-7 text-center">
                        <span aria-hidden="true" className="absolute inset-y-0 start-0 w-1 bg-emerald-500" />
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2">الطريقة الأدقّ</p>
                        <a
                            href={OFFICIAL_EDEVLET}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-base md:text-lg font-bold px-8 py-3.5 rounded-xl shadow-md shadow-emerald-600/20 transition-colors"
                        >
                            <ShieldCheck className="w-5 h-5" />
                            <span>القائمة الرسمية — وزارة الصحة</span>
                            <ExternalLink className="w-4 h-4" />
                        </a>
                        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            تفتح صفحة الحكومة الإلكترونية. اختر الولاية (İl) ثم المنطقة (İlçe) — فتظهر أسماء الصيدليات المناوبة وعناوينها وأرقام هواتفها ووقت المناوبة.
                            <br />
                            <span className="text-slate-400 dark:text-slate-500">بلا تسجيل دخول وبلا رسوم.</span>
                        </p>

                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={openDutyMap}
                                className="inline-flex items-center justify-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                            >
                                <MapIcon className="w-4 h-4" />
                                أو افتح خريطة الصيدليات القريبة منك
                            </button>
                            <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                                يفتح خرائط غوغل عند موقعك. أسرع للوصول، لكنه لا يؤكّد أيّها المناوبة الليلة — تحقّق من القائمة الرسمية قبل أن تقطع مسافة.
                            </p>
                        </div>
                    </div>

                    {/* The single most useful thing we can say about timing. */}
                    <div className="relative overflow-hidden mt-6 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900/40 p-5">
                        <span aria-hidden="true" className="absolute inset-y-0 start-0 w-1 bg-amber-500" />
                        <h2 className="text-sm font-black text-amber-900 dark:text-amber-200 mb-2 flex items-center gap-2">
                            <AlertTriangle size={16} className="shrink-0" />
                            قبل أن تقطع الطريق: تحقّق من وقت المناوبة
                        </h2>
                        <p className="text-sm text-amber-900/90 dark:text-amber-100/80 leading-relaxed">
                            لكل مناوبة <strong>وقت بداية ووقت نهاية</strong> مكتوبان بجانب اسم الصيدلية في القائمة الرسمية، وهما
                            <strong> يختلفان بين منطقة وأخرى</strong>. لا تفترض أن المناوبة تبدأ مساءً — اقرأ التوقيت المعروض،
                            خصوصاً إن كنت ستذهب في ساعة مبكرة من الصباح أو في وقت متأخر.
                        </p>
                    </div>

                    {/* By city — visible city names (long-tail SEO) + per-province page */}
                    <div className="relative overflow-hidden mt-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <span aria-hidden="true" className="absolute inset-y-0 start-0 w-1 bg-emerald-500" />
                        <h2 className="text-base font-black text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                                <Building2 size={16} />
                            </span>
                            حسب المدينة
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">صفحة كل محافظة فيها رابط غرفة الصيادلة المحلية — وهي غالباً أسرع من البوابة العامة — ومناطقها حيّاً حيّاً.</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {CITIES.map((c) => (
                                <Link
                                    key={c.slug}
                                    href={`/tools/pharmacy/${c.slug}`}
                                    className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm transition-all"
                                >
                                    <MapPin size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{c.ar}</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Turkish phrases — the part only we provide. */}
                    <div className="relative overflow-hidden mt-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <span aria-hidden="true" className="absolute inset-y-0 start-0 w-1 bg-indigo-500" />
                        <h2 className="text-base font-black text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                <Languages size={16} />
                            </span>
                            ماذا تقول عند الصيدلية؟
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">أرِ الصيدلي الجملة من شاشة هاتفك إن لم تستطع نطقها.</p>
                        <ul className="space-y-2.5">
                            {PHRASES.map((p) => (
                                <li key={p.tr} className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3">
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{p.ar}</p>
                                    <p dir="ltr" className="mt-1 text-sm text-indigo-700 dark:text-indigo-300 text-start font-medium">{p.tr}</p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* If it is shut / it is serious */}
                    <div className="relative overflow-hidden mt-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <span aria-hidden="true" className="absolute inset-y-0 start-0 w-1 bg-blue-500" />
                        <h2 className="text-base font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                <Info size={16} />
                            </span>
                            وصلت ووجدتها مغلقة؟
                        </h2>
                        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed list-disc list-inside">
                            <li>راجع القائمة الرسمية مرة أخرى — قد تكون المناوبة انتقلت إلى صيدلية أخرى مع بداية اليوم الجديد.</li>
                            <li>بعض الصيدليات المناوبة تخدمك من <strong>شبّاك ليلي</strong> والباب مغلق. اطرق وانتظر قليلاً قبل أن تغادر.</li>
                            <li>إن كانت الحالة لا تحتمل الانتظار، توجّه إلى قسم الطوارئ (<span dir="ltr">Acil</span>) في أقرب مشفى — وفي المشافي صيدليات تعمل على مدار الساعة.</li>
                            <li>في الحالات الطارئة اتصل بـ <a href="tel:112" className="font-bold text-red-600 dark:text-red-400 hover:underline" dir="ltr">112</a> مباشرة.</li>
                        </ul>
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
                            ].map(item => (
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

                    {/* FAQ Section — visible for SEO */}
                    <div className="mt-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <h2 className="text-base font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                                <HelpCircle size={16} />
                            </span>
                            أسئلة شائعة عن الصيدليات المناوبة
                        </h2>
                        <div className="space-y-3">
                            {faqs.map((f) => (
                                <PharmacyFaq key={f.question} question={f.question} answer={f.answer} />
                            ))}
                        </div>
                    </div>

                    {/* Cross-links — curated internal links for SEO */}
                    <div className="mt-6">
                        <CrossLinks context="tool" />
                    </div>

                    <div className="mt-6 flex justify-center">
                        <ShareMenu
                            title="الصيدلية المناوبة في تركيا"
                            text="كيف تجد الصيدلية المناوبة في تركيا من المصدر الرسمي، والعبارات التركية التي تحتاجها عند الصيدلية."
                            url={`${SITE_CONFIG.siteUrl}/tools/pharmacy`}
                            variant="subtle"
                        />
                    </div>

                    <div className="mt-4 text-center">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-2 px-4 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <span>العودة للرئيسية</span>
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                    </div>

                </div>
            </main>
        </div>
    );
}

/** FAQ accordion item */
function PharmacyFaq({ question, answer }: { question: string; answer: string }) {
    return (
        <details className="group border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <summary className="flex items-center justify-between gap-3 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors list-none [&::-webkit-details-marker]:hidden">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 text-start">{question}</h3>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                {answer}
            </div>
        </details>
    );
}
