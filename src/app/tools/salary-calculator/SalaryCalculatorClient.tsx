'use client';

import { useMemo, useState } from 'react';
import {
    Wallet, ArrowLeftRight, Info, ExternalLink, ChevronDown, HelpCircle,
    TrendingDown, Building2, Receipt, ShieldCheck,
} from 'lucide-react';
import PageHero from '@/components/PageHero';
import ShareMenu from '@/components/ShareMenu';
import { SITE_CONFIG } from '@/lib/config';
import CrossLinks from '@/components/seo/CrossLinks';

/* ─────────────────────────────────────────────────────────────────────────
   Verified 2026 Turkey payroll constants (all TL). Cross-checked from official
   sources (SGK, CSGB min-wage bordro, GİB wage tariff) — the statutory minimum
   wage anchor (33,030 gross → 28,075.50 net) reproduces the official bordro
   exactly, which validates the whole methodology.
   ───────────────────────────────────────────────────────────────────────── */
const MW_GROSS = 33030;           // asgari ücret brüt 2026
const SGK_RATE = 0.14;            // employee SGK share (9% + 5% GSS)
const UNEMP_RATE = 0.01;          // employee unemployment insurance
const STAMP_RATE = 0.00759;       // damga vergisi (binde 7.59)
const SGK_CEILING = 297270;       // monthly SGK premium base ceiling
const STAMP_EXEMPT = MW_GROSS * STAMP_RATE;      // 250.70 monthly, exempt for all
// Monthly income-tax base (matrah) of the minimum wage — the basis of the
// income-tax exemption granted to EVERY employee (Law 7349).
const MW_MATRAH = MW_GROSS - MW_GROSS * (SGK_RATE + UNEMP_RATE); // 28,075.50

// Progressive WAGE tax tariff 2026 (cumulative annual bounds). NOTE: the wage
// tariff differs from the non-wage one at steps 3–4 (27% to 1.5M, 35% to 5.3M).
const BRACKETS: Array<{ upTo: number; rate: number }> = [
    { upTo: 190000, rate: 0.15 },
    { upTo: 400000, rate: 0.20 },
    { upTo: 1500000, rate: 0.27 },
    { upTo: 5300000, rate: 0.35 },
    { upTo: Infinity, rate: 0.40 },
];

// Cumulative income tax owed on an annual base.
function taxOn(base: number): number {
    let tax = 0, prev = 0;
    for (const b of BRACKETS) {
        if (base <= prev) break;
        tax += (Math.min(base, b.upTo) - prev) * b.rate;
        prev = b.upTo;
    }
    return tax;
}

interface MonthRow { month: number; sgk: number; unemp: number; incomeTax: number; stamp: number; net: number; }
interface YearResult { months: MonthRow[]; annualGross: number; annualNet: number; avgNet: number; month1: MonthRow; }

// Full-year monthly computation. Income tax is cumulative, so each month's tax
// is the delta of cumulative tax; the minimum-wage exemption is computed the
// legally-correct way (tax on the min-wage cumulative base), so it also grows
// once the min-wage cumulative base crosses a bracket (~month 7).
function computeYear(gross: number): YearResult {
    const sgkBase = Math.min(gross, SGK_CEILING);
    const sgk = sgkBase * SGK_RATE;
    const unemp = sgkBase * UNEMP_RATE;
    const monthlyMatrah = gross - sgkBase * (SGK_RATE + UNEMP_RATE);
    const grossStamp = gross * STAMP_RATE;
    const netStamp = Math.max(0, grossStamp - STAMP_EXEMPT);

    const months: MonthRow[] = [];
    for (let m = 1; m <= 12; m++) {
        const grossTax = taxOn(monthlyMatrah * m) - taxOn(monthlyMatrah * (m - 1));
        const mwExempt = taxOn(MW_MATRAH * m) - taxOn(MW_MATRAH * (m - 1));
        const incomeTax = Math.max(0, grossTax - mwExempt);
        const net = gross - sgk - unemp - incomeTax - netStamp;
        months.push({ month: m, sgk, unemp, incomeTax, stamp: netStamp, net });
    }
    const annualNet = months.reduce((a, b) => a + b.net, 0);
    return { months, annualGross: gross * 12, annualNet, avgNet: annualNet / 12, month1: months[0] };
}

// Invert: find the gross whose FIRST-MONTH net equals a target (monotonic).
function grossFromNet(targetNet: number): number {
    if (targetNet <= 0) return 0;
    let lo = MW_GROSS * 0.5, hi = Math.max(targetNet * 2, MW_GROSS) + 1_000_000;
    for (let i = 0; i < 60; i++) {
        const mid = (lo + hi) / 2;
        const net = computeYear(mid).month1.net;
        if (net < targetNet) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
}

const money = (n: number) =>
    new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(Math.round(n * 100) / 100);

type Mode = 'gross' | 'net';

export default function SalaryCalculatorClient() {
    const [mode, setMode] = useState<Mode>('gross');
    const [amount, setAmount] = useState<string>('');
    const [guideOpen, setGuideOpen] = useState(false);
    const [tableOpen, setTableOpen] = useState(false);

    const parsed = Number((amount || '').replace(/[^\d.]/g, ''));
    const valid = Number.isFinite(parsed) && parsed > 0;

    const result = useMemo(() => {
        if (!valid) return null;
        const gross = mode === 'gross' ? parsed : grossFromNet(parsed);
        return { gross, year: computeYear(gross) };
    }, [parsed, mode, valid]);

    const m1 = result?.year.month1;
    const gross = result?.gross ?? 0;
    const totalDeductM1 = m1 ? m1.sgk + m1.unemp + m1.incomeTax + m1.stamp : 0;
    const netDeclines = result ? Math.round(result.year.months[0].net) !== Math.round(result.year.months[11].net) : false;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo" dir="rtl">
            <PageHero
                title="حاسبة الراتب الصافي والإجمالي في تركيا"
                description="حوّل راتبك بين الإجمالي (Brüt) والصافي (Net) لعام 2026، مع تفصيل كل اقتطاع رسمي: الضمان، البطالة، ضريبة الدخل، وضريبة الطابع."
                icon={<Wallet className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
                titleClassName="md:text-4xl"
            />

            <div className="max-w-3xl mx-auto px-4 py-10 w-full">
                {/* Input card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-7">
                    {/* Mode toggle */}
                    <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-5">
                        {([['gross', 'أعرف الإجمالي (Brüt)'], ['net', 'أعرف الصافي (Net)']] as [Mode, string][]).map(([m, label]) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => setMode(m)}
                                className={`py-2.5 rounded-xl text-sm font-black transition-colors ${mode === m ? 'bg-white dark:bg-slate-950 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <label className="block">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                            <ArrowLeftRight size={16} className="text-emerald-600" />
                            {mode === 'gross' ? 'الراتب الشهري الإجمالي (Brüt)' : 'الراتب الشهري الصافي المطلوب (Net)'}
                        </span>
                        <div className="relative">
                            <input
                                type="text"
                                inputMode="decimal"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder={mode === 'gross' ? 'مثال: 50000' : 'مثال: 40000'}
                                className="w-full h-14 ps-4 pe-16 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xl font-black tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                                dir="ltr"
                            />
                            <span className="absolute end-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">ل.ت</span>
                        </div>
                    </label>

                    <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-500">
                        الحد الأدنى للأجور 2026: <strong className="text-slate-500 dark:text-slate-300">33,030</strong> إجمالي = <strong className="text-slate-500 dark:text-slate-300">28,075.50</strong> صافي.
                    </p>
                </div>

                {/* Result */}
                {result && m1 && (
                    <>
                        {/* Headline */}
                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-950/20 p-5 text-center">
                                <div className="text-[11px] font-black text-emerald-700/70 dark:text-emerald-400/70 mb-1">الراتب الصافي (الشهر الأول)</div>
                                <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400 tabular-nums">{money(m1.net)}</div>
                                <div className="text-[11px] font-bold text-emerald-700/60 dark:text-emerald-400/60 mt-1">ل.ت / شهرياً</div>
                            </div>
                            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 text-center">
                                <div className="text-[11px] font-black text-slate-400 mb-1">الراتب الإجمالي (Brüt)</div>
                                <div className="text-3xl font-black text-slate-900 dark:text-slate-50 tabular-nums">{money(gross)}</div>
                                <div className="text-[11px] font-bold text-slate-400 mt-1">ل.ت / شهرياً</div>
                            </div>
                        </div>

                        {/* Deductions breakdown (first month) */}
                        <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                            <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                                <Receipt size={16} className="text-emerald-600" /> تفصيل الاقتطاعات (الشهر الأول)
                            </h2>
                            <div className="space-y-2 text-sm">
                                {[
                                    ['الضمان الاجتماعي (SGK) — 14%', m1.sgk],
                                    ['تأمين البطالة — 1%', m1.unemp],
                                    ['ضريبة الدخل (بعد إعفاء الحد الأدنى)', m1.incomeTax],
                                    ['ضريبة الطابع (بعد الإعفاء)', m1.stamp],
                                ].map(([label, val]) => (
                                    <div key={label as string} className="flex items-center justify-between gap-3 border-b border-dashed border-slate-100 dark:border-slate-800 pb-2">
                                        <span className="text-slate-600 dark:text-slate-300">{label}</span>
                                        <span className="font-black text-rose-600 dark:text-rose-400 tabular-nums">− {money(val as number)}</span>
                                    </div>
                                ))}
                                <div className="flex items-center justify-between gap-3 pt-1">
                                    <span className="font-black text-slate-800 dark:text-slate-100">إجمالي الاقتطاعات</span>
                                    <span className="font-black text-rose-600 dark:text-rose-400 tabular-nums">− {money(totalDeductM1)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Annual + average */}
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-center">
                                <Building2 size={16} className="mx-auto mb-1.5 text-blue-500" />
                                <div className="text-lg font-black text-slate-900 dark:text-slate-50 tabular-nums">{money(result.year.annualNet)}</div>
                                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-tight mt-0.5">إجمالي الصافي السنوي</div>
                            </div>
                            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-center">
                                <TrendingDown size={16} className="mx-auto mb-1.5 text-amber-500" />
                                <div className="text-lg font-black text-slate-900 dark:text-slate-50 tabular-nums">{money(result.year.avgNet)}</div>
                                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-tight mt-0.5">متوسط الصافي الشهري</div>
                            </div>
                        </div>

                        {/* Why net changes + monthly table */}
                        {netDeclines && (
                            <div className="mt-4">
                                <button
                                    type="button"
                                    onClick={() => setTableOpen((o) => !o)}
                                    className="w-full flex items-center justify-between gap-2 px-5 py-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-right"
                                    aria-expanded={tableOpen}
                                >
                                    <span className="flex items-center gap-2 text-sm font-black text-amber-800 dark:text-amber-300">
                                        <TrendingDown size={16} /> الصافي ينخفض عبر السنة — شوف صافي كل شهر
                                    </span>
                                    <ChevronDown size={18} className={`text-amber-500 transition-transform shrink-0 ${tableOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {tableOpen && (
                                    <div className="mt-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs">
                                                        <th className="text-start font-black px-4 py-2.5">الشهر</th>
                                                        <th className="text-end font-black px-4 py-2.5">ضريبة الدخل</th>
                                                        <th className="text-end font-black px-4 py-2.5">الصافي</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {result.year.months.map((r) => (
                                                        <tr key={r.month} className="border-t border-slate-100 dark:border-slate-800">
                                                            <td className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300 tabular-nums">{r.month}</td>
                                                            <td className="px-4 py-2 text-end text-rose-600 dark:text-rose-400 tabular-nums">{money(r.incomeTax)}</td>
                                                            <td className="px-4 py-2 text-end font-black text-slate-900 dark:text-slate-50 tabular-nums">{money(r.net)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* Reference / YMYL note */}
                <div className="mt-6 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/70 dark:bg-blue-950/20 p-5">
                    <div className="flex items-start gap-3">
                        <Info size={20} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <div className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed space-y-2">
                            <p className="font-black text-slate-900 dark:text-slate-100">كيف نحسب؟</p>
                            <p>
                                نبدأ من الراتب الإجمالي ونخصم: الضمان الاجتماعي <strong>14%</strong> + البطالة <strong>1%</strong> + ضريبة الدخل التصاعدية (بعد إعفاء الحد الأدنى للأجور) + ضريبة الطابع <strong>0.759%</strong>. الأرقام رسمية لعام 2026 وتطابق بوردرو الحد الأدنى الرسمي بالضبط.
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                النتيجة تقديرية للاسترشاد، وتفترض موظفاً بدوام كامل بلا اقتطاعات إضافية (تأمين خاص، نقابة، BES). للحالات الخاصة راجع محاسباً أو دائرة الضرائب.
                            </p>
                            <a
                                href="https://www.gib.gov.tr/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-black text-xs hover:underline"
                            >
                                <ExternalLink size={13} /> دائرة الإيرادات التركية (gib.gov.tr)
                            </a>
                        </div>
                    </div>
                </div>

                {/* Share */}
                <div className="mt-6 flex justify-center">
                    <ShareMenu
                        url={`${SITE_CONFIG.siteUrl}/tools/salary-calculator`}
                        title="حاسبة الراتب الصافي والإجمالي في تركيا 2026"
                    />
                </div>

                {/* How-to */}
                <div className="mt-8">
                    <button
                        type="button"
                        onClick={() => setGuideOpen((o) => !o)}
                        className="w-full flex items-center justify-between gap-2 px-5 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-right"
                        aria-expanded={guideOpen}
                    >
                        <span className="flex items-center gap-2 font-black text-slate-800 dark:text-slate-100">
                            <HelpCircle size={18} className="text-emerald-600" /> كيف تستخدم الحاسبة؟
                        </span>
                        <ChevronDown size={18} className={`text-slate-400 transition-transform ${guideOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {guideOpen && (
                        <div className="mt-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 text-sm text-slate-700 dark:text-slate-200 leading-relaxed space-y-3">
                            <p>1. اختر إن كنت تعرف <strong>الإجمالي (Brüt)</strong> وتريد الصافي، أو تعرف <strong>الصافي (Net)</strong> وتريد معرفة الإجمالي المقابل.</p>
                            <p>2. أدخل المبلغ الشهري بالليرة، وتظهر النتيجة والاقتطاعات فوراً.</p>
                            <p>3. افتح جدول «صافي كل شهر» لترى كيف ينخفض الصافي تدريجياً عبر السنة بسبب <strong>ضريبة الدخل التراكمية</strong> (كلما ارتفع مجموع دخلك السنوي دخلت شريحة ضريبية أعلى).</p>
                            <p className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                <ShieldCheck size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                                الحساب يتم بالكامل على جهازك — لا نرسل راتبك لأي خادم.
                            </p>
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
