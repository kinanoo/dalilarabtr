'use client';

import { useMemo, useState } from 'react';
import {
    Home, TrendingUp, Info, ExternalLink, ChevronDown, HelpCircle,
    AlertTriangle, ArrowLeft, ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import PageHero from '@/components/PageHero';
import ShareMenu from '@/components/ShareMenu';
import { SITE_CONFIG } from '@/lib/config';
import CrossLinks from '@/components/seo/CrossLinks';

/* ─────────────────────────────────────────────────────────────────────────
   Legal rule (Türk Borçlar Kanunu art. 344): the annual rent increase at
   renewal is capped at the 12-MONTH AVERAGE of TÜFE for the renewal month —
   NOT the monthly (~2%) inflation figure that some calculators wrongly show.
   The temporary 25% residential cap EXPIRED on 1 July 2024 and was not renewed;
   residential now follows the same 12-month-average TÜFE rule as commercial.

   Table below = official 12-month-average TÜFE (%) by 2026 renewal month.
   Source: TÜİK (via law-firm/TÜİK-citing references). Cross-verified Jun/Jul.
   Refresh monthly as TÜİK publishes new figures (~3rd of each month).
   ───────────────────────────────────────────────────────────────────────── */
const TUFE_2026: Array<{ value: string; label: string; rate: number }> = [
    { value: '2026-07', label: 'يوليو 2026', rate: 32.03 },
    { value: '2026-06', label: 'يونيو 2026', rate: 32.24 },
    { value: '2026-05', label: 'مايو 2026', rate: 32.43 },
    { value: '2026-04', label: 'أبريل 2026', rate: 32.82 },
    { value: '2026-03', label: 'مارس 2026', rate: 33.39 },
    { value: '2026-02', label: 'فبراير 2026', rate: 33.98 },
    { value: '2026-01', label: 'يناير 2026', rate: 34.88 },
];

const money = (n: number) =>
    new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(Math.round(n * 100) / 100);

export default function RentIncreaseCalculatorClient() {
    const [rent, setRent] = useState('');
    const [month, setMonth] = useState(TUFE_2026[0].value); // default: latest known month
    const [manual, setManual] = useState(false);
    const [manualRate, setManualRate] = useState('');
    const [guideOpen, setGuideOpen] = useState(false);

    const monthRate = TUFE_2026.find((m) => m.value === month)?.rate ?? TUFE_2026[0].rate;
    const rate = manual ? Number((manualRate || '').replace(/[^\d.]/g, '')) : monthRate;
    const current = Number((rent || '').replace(/[^\d.]/g, ''));
    const valid = Number.isFinite(current) && current > 0 && Number.isFinite(rate) && rate >= 0;

    const result = useMemo(() => {
        if (!valid) return null;
        const increase = current * (rate / 100);
        const newRent = current + increase;
        return { increase, newRent, annualDiff: increase * 12 };
    }, [current, rate, valid]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo" dir="rtl">
            <PageHero
                title="حاسبة زيادة الإيجار القانونية في تركيا"
                description="اعرف الحد الأقصى القانوني لزيادة إيجارك السنوية لعام 2026 حسب متوسط مؤشر الأسعار (TÜFE) لاثني عشر شهراً — واحمِ نفسك من الزيادات غير القانونية."
                icon={<Home className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
                titleClassName="md:text-4xl"
            />

            <div className="max-w-3xl mx-auto px-4 py-10 w-full">
                {/* Input card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-7 space-y-5">
                    <label className="block">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                            <Home size={16} className="text-emerald-600" /> الإيجار الشهري الحالي
                        </span>
                        <div className="relative">
                            <input
                                type="text" inputMode="decimal" value={rent}
                                onChange={(e) => setRent(e.target.value)} placeholder="مثال: 15000"
                                className="w-full h-14 ps-4 pe-16 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xl font-black tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                                dir="ltr"
                            />
                            <span className="absolute end-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">ل.ت</span>
                        </div>
                    </label>

                    <div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                            <TrendingUp size={16} className="text-emerald-600" /> شهر تجديد العقد
                        </span>
                        <select
                            value={manual ? 'manual' : month}
                            onChange={(e) => {
                                if (e.target.value === 'manual') { setManual(true); }
                                else { setManual(false); setMonth(e.target.value); }
                            }}
                            className="w-full h-12 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
                        >
                            {TUFE_2026.map((m) => (
                                <option key={m.value} value={m.value}>{m.label} — السقف {m.rate}%</option>
                            ))}
                            <option value="manual">شهر آخر / أُدخل النسبة يدوياً</option>
                        </select>
                        {manual && (
                            <div className="relative mt-3">
                                <input
                                    type="text" inputMode="decimal" value={manualRate}
                                    onChange={(e) => setManualRate(e.target.value)} placeholder="نسبة متوسط TÜFE لـ12 شهراً (مثال: 32.03)"
                                    className="w-full h-11 ps-4 pe-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                                    dir="ltr"
                                />
                                <span className="absolute end-3 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">%</span>
                            </div>
                        )}
                        <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                            السقف = متوسط TÜFE لاثني عشر شهراً في شهر التجديد. النِسب لأشهر لاحقة تُنشر مطلع كل شهر عبر TÜİK.
                        </p>
                    </div>
                </div>

                {/* Result */}
                {result && (
                    <>
                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-950/20 p-5 text-center">
                                <div className="text-[11px] font-black text-emerald-700/70 dark:text-emerald-400/70 mb-1">الحد الأقصى القانوني للإيجار الجديد</div>
                                <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400 tabular-nums">{money(result.newRent)}</div>
                                <div className="text-[11px] font-bold text-emerald-700/60 dark:text-emerald-400/60 mt-1">ل.ت / شهرياً</div>
                            </div>
                            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 text-center">
                                <div className="text-[11px] font-black text-slate-400 mb-1">مقدار الزيادة الشهرية (بنسبة {rate}%)</div>
                                <div className="text-3xl font-black text-slate-900 dark:text-slate-50 tabular-nums">+{money(result.increase)}</div>
                                <div className="text-[11px] font-bold text-slate-400 mt-1">أي {money(result.annualDiff)} ل.ت سنوياً</div>
                            </div>
                        </div>
                        <div className="mt-3 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-950/20 p-4 flex items-start gap-2.5">
                            <ShieldCheck size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                                هذا هو <strong>الحد الأقصى</strong> المسموح قانوناً. أي زيادة أعلى منه غير قانونية حتى لو نصّ عليها العقد، ويحق لك رفضها. الزيادة تُطبَّق <strong>مرة واحدة سنوياً</strong> عند التجديد فقط.
                            </p>
                        </div>
                    </>
                )}

                {/* Reference / YMYL note */}
                <div className="mt-6 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/70 dark:bg-blue-950/20 p-5">
                    <div className="flex items-start gap-3">
                        <Info size={20} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <div className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed space-y-2">
                            <p className="font-black text-slate-900 dark:text-slate-100">القاعدة القانونية</p>
                            <p>
                                حسب قانون الالتزامات التركي (المادة 344)، لا يجوز أن تتجاوز الزيادة السنوية <strong>متوسط مؤشر أسعار المستهلك (TÜFE) لاثني عشر شهراً</strong> في شهر التجديد. سقف الـ25% المؤقت للمساكن <strong>انتهى في 1 يوليو 2024</strong> ولم يُمدَّد.
                            </p>
                            <p className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400 font-bold">
                                <AlertTriangle size={13} className="shrink-0 mt-0.5" /> انتبه: بعض المواقع تعرض التضخم الشهري (~2%) كنسبة زيادة — هذا خطأ. السقف القانوني هو متوسط 12 شهراً (~32% حالياً).
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                بعد 5 سنوات يمكن لصاحب العقار رفع دعوى تحديد أجرة أمام المحكمة. النتيجة استرشادية؛ تحقّق من النسبة الرسمية لشهرك وراجع محامياً عند النزاع.
                            </p>
                            <a href="https://www.tuik.gov.tr/" target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-black text-xs hover:underline">
                                <ExternalLink size={13} /> هيئة الإحصاء التركية TÜİK (tuik.gov.tr)
                            </a>
                        </div>
                    </div>
                </div>

                {/* Cross-link to rent-rights articles */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Link href="/article/rent-contract-tenant-rights-turkey-2026" className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors group">
                        <span className="grid place-items-center w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 shrink-0"><Home size={18} /></span>
                        <span className="min-w-0">
                            <span className="block text-sm font-black text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">عقد الإيجار وحقوق المستأجر</span>
                            <span className="block text-xs text-slate-500 dark:text-slate-400">دليلك الكامل لحقوقك وسقف الزيادة والإخلاء</span>
                        </span>
                    </Link>
                    <Link href="/article/tenant-rights-rent-increase-cap" className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors group">
                        <span className="grid place-items-center w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 shrink-0"><ShieldCheck size={18} /></span>
                        <span className="min-w-0">
                            <span className="block text-sm font-black text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">سقف زيادة الإيجار القانوني</span>
                            <span className="block text-xs text-slate-500 dark:text-slate-400">كيف تعترض على زيادة غير قانونية خطوة بخطوة</span>
                        </span>
                    </Link>
                </div>

                {/* Share */}
                <div className="mt-6 flex justify-center">
                    <ShareMenu url={`${SITE_CONFIG.siteUrl}/tools/rent-increase-calculator`} title="حاسبة زيادة الإيجار القانونية في تركيا 2026" />
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
                            <p>1. أدخل <strong>إيجارك الشهري الحالي</strong> بالليرة.</p>
                            <p>2. اختر <strong>شهر تجديد عقدك</strong> — تُملأ نسبة السقف القانوني تلقائياً (متوسط TÜFE لـ12 شهراً)، أو أدخلها يدوياً لشهر لاحق.</p>
                            <p>3. يظهر <strong>الحد الأقصى القانوني</strong> للإيجار الجديد ومقدار الزيادة المسموحة.</p>
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
