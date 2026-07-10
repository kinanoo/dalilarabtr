'use client';

import { HeartPulse, ExternalLink, ShieldCheck, MapPin, ArrowLeft, Phone, Info, Clock, ChevronDown, HelpCircle, Navigation, Building2 } from 'lucide-react';
import Link from 'next/link';
import PageHero from '@/components/PageHero';
import ShareMenu from '@/components/ShareMenu';
import { SITE_CONFIG } from '@/lib/config';
import CrossLinks from '@/components/seo/CrossLinks';

const OFFICIAL_EDEVLET = 'https://www.turkiye.gov.tr/saglik-titck-nobetci-eczane-sorgulama';

// Major provinces most searched by Arab/Syrian residents (Turkish name for the
// map query + Arabic display). Rendered as visible text → long-tail SEO for
// «صيدلية مناوبة [مدينة]», and each opens a live map of on-duty pharmacies.
const CITIES: { tr: string; ar: string }[] = [
    { tr: 'İstanbul', ar: 'إسطنبول' }, { tr: 'Gaziantep', ar: 'غازي عنتاب' },
    { tr: 'Mersin', ar: 'مرسين' }, { tr: 'Adana', ar: 'أضنة' },
    { tr: 'Hatay', ar: 'هاتاي (أنطاكية)' }, { tr: 'Bursa', ar: 'بورصة' },
    { tr: 'Ankara', ar: 'أنقرة' }, { tr: 'İzmir', ar: 'إزمير' },
    { tr: 'Şanlıurfa', ar: 'شانلي أورفا' }, { tr: 'Konya', ar: 'قونية' },
    { tr: 'Kayseri', ar: 'قيصري' }, { tr: 'Kilis', ar: 'كلّس' },
    { tr: 'Kahramanmaraş', ar: 'كهرمان مرعش' }, { tr: 'Malatya', ar: 'ملاطية' },
    { tr: 'Kocaeli', ar: 'كوجالي' }, { tr: 'Antalya', ar: 'أنطاليا' },
    { tr: 'Mardin', ar: 'ماردين' }, { tr: 'Sakarya', ar: 'سكاريا' },
];

const cityMapUrl = (tr: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Nöbetçi Eczane ${tr}`)}`;

function nearMe() {
    // "Near me now": open a live map of on-duty pharmacies around the user's
    // current position. Falls back to a plain Maps search if geolocation is
    // denied/unavailable.
    const openSearch = () => window.open(
        'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Nöbetçi Eczane'),
        '_blank', 'noopener,noreferrer',
    );
    if (typeof navigator === 'undefined' || !navigator.geolocation) { openSearch(); return; }
    navigator.geolocation.getCurrentPosition(
        (pos) => window.open(
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Nöbetçi Eczane')}&center=${pos.coords.latitude},${pos.coords.longitude}`,
            '_blank', 'noopener,noreferrer',
        ),
        () => openSearch(),
        { timeout: 8000 },
    );
}

/*
 * 2026-07 redesign — brought in line with the site's new design language:
 * shared light PageHero instead of the hand-rolled dark red hero, flat
 * white/slate cards with a thin start-side accent rail (logical utilities),
 * solid emerald-600 primary action, and zero instructional filler.
 */

export default function PharmacyPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo flex flex-col">

            <PageHero
                title="أقرب صيدلية مناوبة مفتوحة الآن"
                description="اعثر على أقرب صيدلية مناوبة (Nöbetçi Eczane) قرب موقعك في تركيا — بموقعك مباشرة، حسب مدينتك، أو عبر المصدر الرسمي e-Devlet"
                icon={<HeartPulse className="w-10 h-10 md:w-12 md:h-12 text-red-500" />}
            />

            <main className="flex-grow py-10 px-4">
                <div className="container mx-auto max-w-2xl">

                    {/* Intro — unique, indexable, matches the searcher's need */}
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5 text-center">
                        الصيدلية المناوبة (نوبتشي إجزانه) هي الصيدلية المفتوحة خارج ساعات الدوام والليل والعطل، وتتغيّر يومياً بالتناوب.
                        أسرع طريقة لمعرفة أقربها الآن: افتحها على الخريطة قرب موقعك، أو اختر مدينتك أدناه، أو استعلم من بوابة e-Devlet الرسمية.
                    </p>

                    {/* Primary action: near me now (geolocation → live map) */}
                    <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-7 text-center">
                        <span aria-hidden="true" className="absolute inset-y-0 start-0 w-1 bg-emerald-500" />
                        <button
                            type="button"
                            onClick={nearMe}
                            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-base md:text-lg font-bold px-8 py-3.5 rounded-xl shadow-md shadow-emerald-600/20 transition-colors"
                        >
                            <Navigation className="w-5 h-5" />
                            <span>الصيدليات المناوبة قرب موقعي الآن</span>
                        </button>
                        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">يفتح خريطة الصيدليات القريبة منك مباشرة (اسمح بالوصول لموقعك لأدقّ نتيجة).</p>

                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <a
                                href={OFFICIAL_EDEVLET}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                القائمة الرسمية المعتمدة عبر e-Devlet
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> يغطي 81 ولاية</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> مناوبة 24/7 تتغيّر يومياً</span>
                            </div>
                        </div>
                    </div>

                    {/* By city — visible city names (long-tail SEO) + a live map per city */}
                    <div className="relative overflow-hidden mt-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <span aria-hidden="true" className="absolute inset-y-0 start-0 w-1 bg-emerald-500" />
                        <h2 className="text-base font-black text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                                <Building2 size={16} />
                            </span>
                            الصيدلية المناوبة حسب المدينة
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">اختر مدينتك لعرض الصيدليات المناوبة القريبة عليها على الخريطة الآن.</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {CITIES.map((c) => (
                                <a
                                    key={c.tr}
                                    href={cityMapUrl(c.tr)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm transition-all"
                                >
                                    <MapPin size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{c.ar}</span>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* How to use */}
                    <div className="relative overflow-hidden mt-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <span aria-hidden="true" className="absolute inset-y-0 start-0 w-1 bg-blue-500" />
                        <h2 className="text-base font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                <Info size={16} />
                            </span>
                            كيف تستخدم الخدمة؟
                        </h2>
                        <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-300 list-decimal list-inside leading-relaxed">
                            <li>الأسرع: اضغط «الصيدليات المناوبة قرب موقعي الآن» وستفتح خريطة بأقرب الصيدليات.</li>
                            <li>أو اختر مدينتك من قائمة المدن أعلاه لعرضها على الخريطة مباشرة.</li>
                            <li>للقائمة الرسمية المعتمدة: افتح e-Devlet، اختر الولاية (İl) ثم المنطقة (İlçe) لتظهر الصيدليات المناوبة بعناوينها وأرقامها.</li>
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
                            <PharmacyFaq
                                question="كيف أعرف الصيدلية المناوبة في موقعي الآن؟"
                                answer="اضغط على رابط e-Devlet الرسمي أعلاه، ثم اختر الولاية (İl) والمنطقة (İlçe) وستظهر لك قائمة الصيدليات المناوبة المفتوحة حالياً مع العناوين وأرقام الهاتف."
                            />
                            <PharmacyFaq
                                question="ما هي ساعات عمل الصيدلية المناوبة؟"
                                answer="الصيدلية المناوبة (Nöbetçi Eczane) تعمل على مدار الساعة 24/7 خلال فترة مناوبتها. يتم تغيير المناوبة يومياً."
                            />
                            <PharmacyFaq
                                question="هل أحتاج حساب e-Devlet لمعرفة الصيدلية المناوبة؟"
                                answer="لا، خدمة البحث عن الصيدليات المناوبة متاحة للجميع بدون تسجيل دخول. فقط اضغط الرابط واختر منطقتك."
                            />
                            <PharmacyFaq
                                question="هل الخدمة تغطي كل مدن تركيا؟"
                                answer="نعم، الخدمة مرتبطة ببوابة الحكومة الإلكترونية e-Devlet وتغطي كافة الولايات التركية الـ 81 بما فيها إسطنبول، أنقرة، غازي عنتاب، مرسين، أنطاليا وغيرها."
                            />
                        </div>
                    </div>

                    {/* Cross-links — curated internal links for SEO */}
                    <div className="mt-6">
                        <CrossLinks context="tool" />
                    </div>

                    <div className="mt-6 flex justify-center">
                        <ShareMenu
                            title="الصيدليات المناوبة في تركيا"
                            text="رابط مباشر لمعرفة الصيدلية المناوبة في منطقتك عبر بوابة e-Devlet الرسمية."
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
