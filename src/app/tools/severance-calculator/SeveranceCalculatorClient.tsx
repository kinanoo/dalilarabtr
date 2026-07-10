'use client';

import { useMemo, useState } from 'react';
import {
    Coins, CalendarClock, Info, ExternalLink, ChevronDown, HelpCircle,
    Receipt, Wallet, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import PageHero from '@/components/PageHero';
import ShareMenu from '@/components/ShareMenu';
import { SITE_CONFIG } from '@/lib/config';
import CrossLinks from '@/components/seo/CrossLinks';

/* ─────────────────────────────────────────────────────────────────────────
   Verified 2026 Turkey severance/notice constants (all TL).
   - Kıdem tazminatı tavanı (per-year ceiling), H2 2026 (1 Jul–31 Dec 2026):
     73,729.87 TL — cross-verified (coefficient 1.575512; Alomaliye/PwC).
     Updates every 6 months → refresh in January 2027.
   - İhbar notice weeks: İş Kanunu 4857 art. 17 (statutory, stable).
   - Kıdem is income-tax exempt up to the tavanı; only stamp 0.759% applies.
     İhbar is subject to income tax + stamp.
   ───────────────────────────────────────────────────────────────────────── */
const KIDEM_TAVANI = 73729.87;
const TAVANI_PERIOD = 'النصف الثاني من 2026 (1 يوليو – 31 ديسمبر)';
const STAMP_RATE = 0.00759;
const DAY_MS = 86_400_000;

function daysBetween(fromIso: string, toIso: string): number {
    if (!fromIso || !toIso) return 0;
    const a = new Date(fromIso + 'T00:00:00Z').getTime();
    const b = new Date(toIso + 'T00:00:00Z').getTime();
    if (isNaN(a) || isNaN(b) || b < a) return 0;
    return Math.round((b - a) / DAY_MS);
}

// İhbar notice weeks by tenure (İş Kanunu 4857/17).
function noticeWeeks(days: number): number {
    if (days < 182) return 2;        // < 6 months
    if (days < 548) return 4;        // 6 months – 1.5 years
    if (days < 1095) return 6;       // 1.5 – 3 years
    return 8;                        // > 3 years
}

const money = (n: number) =>
    new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(Math.round(n * 100) / 100);

export default function SeveranceCalculatorClient() {
    const [wage, setWage] = useState('');
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [eligible, setEligible] = useState(true); // "terminated without just cause / retirement" → kıdem due
    const [guideOpen, setGuideOpen] = useState(false);

    const todayIso = useMemo(() => new Date().toISOString().split('T')[0], []);
    const gross = Number((wage || '').replace(/[^\d.]/g, ''));
    const validWage = Number.isFinite(gross) && gross > 0;

    const result = useMemo(() => {
        if (!validWage || !start || !end) return null;
        const days = daysBetween(start, end);
        if (days <= 0) return null;

        const y = Math.floor(days / 365);
        const remDays = days - y * 365;
        const m = Math.floor(remDays / 30);
        const d = remDays - m * 30;

        // Kıdem — gross wage capped at the yearly ceiling, prorated over service.
        const cappedWage = Math.min(gross, KIDEM_TAVANI);
        const kidemQualifies = days >= 365; // min 1 full year
        const kidemGross = kidemQualifies ? cappedWage * (days / 365) : 0;
        const kidemStamp = kidemGross * STAMP_RATE;
        const kidemNet = kidemGross - kidemStamp;
        const capped = gross > KIDEM_TAVANI;

        // İhbar — weekly gross × statutory weeks (subject to income tax separately).
        const weeks = noticeWeeks(days);
        const dailyWage = gross / 30;
        const ihbarGross = dailyWage * 7 * weeks;

        return {
            days, y, m, d, kidemQualifies, kidemGross, kidemStamp, kidemNet, capped,
            weeks, ihbarGross,
        };
    }, [gross, start, end, validWage]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo" dir="rtl">
            <PageHero
                title="حاسبة تعويض نهاية الخدمة في تركيا"
                description="احسب تعويض نهاية الخدمة (Kıdem) وتعويض الإشعار (İhbar) لعام 2026 حسب راتبك ومدة عملك — مع شروط الاستحقاق والسقف الرسمي."
                icon={<Coins className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
                titleClassName="md:text-4xl"
            />

            <div className="max-w-3xl mx-auto px-4 py-10 w-full">
                {/* Input card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-7 space-y-5">
                    <label className="block">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                            <Wallet size={16} className="text-emerald-600" /> الراتب الشهري الإجمالي (Brüt)
                        </span>
                        <div className="relative">
                            <input
                                type="text" inputMode="decimal" value={wage}
                                onChange={(e) => setWage(e.target.value)} placeholder="مثال: 45000"
                                className="w-full h-14 ps-4 pe-16 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xl font-black tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                                dir="ltr"
                            />
                            <span className="absolute end-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">ل.ت</span>
                        </div>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="block">
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">تاريخ بدء العمل</span>
                            <input type="date" max={end || todayIso} value={start} onChange={(e) => setStart(e.target.value)}
                                className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/40" dir="ltr" />
                        </label>
                        <label className="block">
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">تاريخ نهاية العمل</span>
                            <input type="date" min={start || undefined} value={end} onChange={(e) => setEnd(e.target.value)}
                                className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/40" dir="ltr" />
                        </label>
                    </div>

                    <label className="flex items-start gap-2.5 cursor-pointer select-none rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 p-3">
                        <input type="checkbox" checked={eligible} onChange={(e) => setEligible(e.target.checked)} className="mt-0.5 w-4 h-4 accent-emerald-600" />
                        <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            أُنهي عملي <strong>من صاحب العمل دون سبب مشروع</strong> (أو تقاعد/وفاة، أو استقالة لسبب قانوني كالخدمة العسكرية أو زواج المرأة). إن كانت استقالة عادية، فغالباً <strong>لا يُستحق</strong> تعويض نهاية الخدمة.
                        </span>
                    </label>
                </div>

                {/* Results */}
                {result && (
                    <>
                        {/* Tenure */}
                        <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center justify-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                            <CalendarClock size={16} className="text-emerald-600" />
                            مدة الخدمة: <span className="tabular-nums text-slate-900 dark:text-slate-50">{result.y}</span> سنة و
                            <span className="tabular-nums text-slate-900 dark:text-slate-50">{result.m}</span> شهر و
                            <span className="tabular-nums text-slate-900 dark:text-slate-50">{result.d}</span> يوم
                        </div>

                        {/* Kıdem */}
                        <div className="mt-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-950/20 p-5">
                            <div className="flex items-center justify-between gap-3 mb-3">
                                <h2 className="text-sm font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                                    <Coins size={16} /> تعويض نهاية الخدمة (Kıdem)
                                </h2>
                                {(eligible && result.kidemQualifies)
                                    ? <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-white/70 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full"><CheckCircle2 size={11} /> مستحق</span>
                                    : <span className="inline-flex items-center gap-1 text-[10px] font-black text-slate-500 bg-white/70 dark:bg-slate-800 px-2 py-0.5 rounded-full"><AlertTriangle size={11} /> غير مستحق</span>}
                            </div>
                            {(eligible && result.kidemQualifies) ? (
                                <>
                                    <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400 tabular-nums">{money(result.kidemNet)} <span className="text-sm font-bold">ل.ت</span></div>
                                    <p className="text-[11px] text-emerald-700/70 dark:text-emerald-400/70 mt-1">صافٍ بعد خصم ضريبة الطابع ({money(result.kidemStamp)} ل.ت) — معفى من ضريبة الدخل.</p>
                                    {result.capped && (
                                        <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-2 flex items-start gap-1">
                                            <AlertTriangle size={12} className="shrink-0 mt-0.5" /> راتبك يتجاوز السقف الرسمي؛ احتُسب على أساس السقف {money(KIDEM_TAVANI)} ل.ت شهرياً.
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                    {!result.kidemQualifies
                                        ? 'مدة الخدمة أقل من سنة كاملة — لا يُستحق تعويض نهاية الخدمة قانونياً.'
                                        : 'حسب اختيارك (استقالة عادية)، لا يُستحق تعويض نهاية الخدمة عادةً. راجع الشروط أدناه.'}
                                </p>
                            )}
                        </div>

                        {/* İhbar */}
                        <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                            <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">
                                <Receipt size={16} className="text-blue-500" /> تعويض الإشعار (İhbar) — إجمالي
                            </h2>
                            <div className="text-3xl font-black text-slate-900 dark:text-slate-50 tabular-nums">{money(result.ihbarGross)} <span className="text-sm font-bold text-slate-400">ل.ت</span></div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                = أجر <span className="tabular-nums font-bold">{result.weeks}</span> أسابيع (حسب مدة خدمتك). يُستحق عند إنهاء العقد دون مهلة إشعار.
                            </p>
                            <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-2 flex items-start gap-1">
                                <AlertTriangle size={12} className="shrink-0 mt-0.5" /> بخلاف تعويض نهاية الخدمة، تعويض الإشعار <strong>خاضع لضريبة الدخل وضريبة الطابع</strong> (يُقتطعان منه)، فالمبلغ الصافي أقل.
                            </p>
                        </div>
                    </>
                )}

                {/* Reference / YMYL note */}
                <div className="mt-6 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/70 dark:bg-blue-950/20 p-5">
                    <div className="flex items-start gap-3">
                        <Info size={20} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <div className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed space-y-2">
                            <p className="font-black text-slate-900 dark:text-slate-100">معلومات مهمة</p>
                            <ul className="list-disc ps-5 space-y-1 text-[13px]">
                                <li>تعويض نهاية الخدمة = راتب شهر إجمالي عن كل سنة عمل + نسبة للأشهر، ويُشترط سنة خدمة كاملة.</li>
                                <li>السقف الرسمي للراتب المُحتسب: <strong>{money(KIDEM_TAVANI)} ل.ت</strong> شهرياً لـ{TAVANI_PERIOD}.</li>
                                <li>مدد الإشعار (İhbar): أقل من 6 أشهر = أسبوعان، حتى سنة ونصف = 4، حتى 3 سنوات = 6، أكثر = 8 أسابيع.</li>
                            </ul>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                النتيجة تقديرية للاسترشاد وتستخدم الراتب الإجمالي الأساسي (الأجر الفعلي قد يشمل بدلات منتظمة فيكون أعلى قليلاً). للنزاعات راجع محامي عمل أو نقابة.
                            </p>
                            <a href="https://www.csgb.gov.tr/" target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-black text-xs hover:underline">
                                <ExternalLink size={13} /> وزارة العمل والضمان الاجتماعي (csgb.gov.tr)
                            </a>
                        </div>
                    </div>
                </div>

                {/* Cross-link to salary calculator */}
                <div className="mt-4">
                    <Link href="/tools/salary-calculator" className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors group">
                        <span className="grid place-items-center w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 shrink-0"><Wallet size={18} /></span>
                        <span className="min-w-0">
                            <span className="block text-sm font-black text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">حاسبة الراتب الصافي والإجمالي</span>
                            <span className="block text-xs text-slate-500 dark:text-slate-400">حوّل راتبك بين الإجمالي والصافي واعرف اقتطاعاتك الشهرية</span>
                        </span>
                    </Link>
                </div>

                {/* Share */}
                <div className="mt-6 flex justify-center">
                    <ShareMenu url={`${SITE_CONFIG.siteUrl}/tools/severance-calculator`} title="حاسبة تعويض نهاية الخدمة في تركيا 2026" />
                </div>

                {/* How-to */}
                <div className="mt-8">
                    <button type="button" onClick={() => setGuideOpen((o) => !o)}
                        className="w-full flex items-center justify-between gap-2 px-5 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-right" aria-expanded={guideOpen}>
                        <span className="flex items-center gap-2 font-black text-slate-800 dark:text-slate-100">
                            <HelpCircle size={18} className="text-emerald-600" /> كيف تستخدم الحاسبة؟
                        </span>
                        <ChevronDown size={18} className={`text-slate-400 transition-transform ${guideOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {guideOpen && (
                        <div className="mt-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 text-sm text-slate-700 dark:text-slate-200 leading-relaxed space-y-3">
                            <p>1. أدخل <strong>راتبك الشهري الإجمالي</strong> (Brüt) وتاريخَي بدء ونهاية العمل.</p>
                            <p>2. حدّد إن كان الإنهاء <strong>من صاحب العمل</strong> أو لسبب قانوني (يمنحك تعويض نهاية الخدمة).</p>
                            <p>3. تظهر النتائج فوراً: تعويض نهاية الخدمة (صافٍ) وتعويض الإشعار (إجمالي) ومدة خدمتك.</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">الحساب يتم على جهازك — لا نرسل بياناتك لأي خادم.</p>
                        </div>
                    )}
                </div>

                <div className="mt-10">
                    <CrossLinks context="tool" />
                </div>
            </div>
        </div>
    );
}
