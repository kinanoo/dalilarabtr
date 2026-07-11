'use client';

/**
 * CurrencyClient — live TRY exchange board + converter, the audience's #1 daily
 * check. Reuses the existing /api/rates route (USD/EUR/SAR/gram gold/SYP, each
 * as "TRY per 1 unit", plus a daily change %). All conversion goes through TRY:
 * amount × tryPerUnit[from] / tryPerUnit[to]. Latin digits only, RTL, graceful
 * when a source omits a currency (that option simply doesn't appear).
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
    Coins, RefreshCw, TrendingUp, TrendingDown, ArrowLeftRight,
    Wallet, AlertTriangle, ChevronLeft,
} from 'lucide-react';
import PageHero from '@/components/PageHero';
import ShareMenu from '@/components/ShareMenu';
import { SITE_CONFIG } from '@/lib/config';

type Rate = { value: number; change: number };
interface RatesPayload {
    usd: Rate | null; eur: Rate | null; sar: Rate | null;
    gold: Rate | null; goldOz?: Rate | null;
    syp?: Rate | null; sypUsd?: Rate | null; sypTry?: Rate | null;
}
interface ApiResponse { ok: boolean; rates?: RatesPayload; updated?: string | null }

// A currency the converter can use — everything priced as "TRY per 1 unit".
interface Currency {
    code: string;
    label: string;
    flag: string;
    tryPerUnit: number;
    decimals: number;
}

const fmt = (n: number, dec: number) =>
    Number.isFinite(n)
        ? n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
        : '—';

// Compact grouping for the big result / SYP amounts.
const fmtSmart = (n: number, dec: number) =>
    !Number.isFinite(n) ? '—'
        : Math.abs(n) >= 1000
            ? n.toLocaleString('en-US', { maximumFractionDigits: n >= 100000 ? 0 : dec })
            : n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });

export default function CurrencyClient() {
    const [data, setData] = useState<RatesPayload | null>(null);
    const [updated, setUpdated] = useState<string | null>(null);
    const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
    const [refreshing, setRefreshing] = useState(false);

    const [amount, setAmount] = useState('100');
    const [from, setFrom] = useState('USD');
    const [to, setTo] = useState('TRY');

    const load = useCallback(async (silent = false) => {
        if (silent) setRefreshing(true); else setStatus('loading');
        try {
            const res = await fetch('/api/rates', { cache: 'no-store' });
            const json: ApiResponse = await res.json();
            if (json.ok && json.rates) {
                setData(json.rates);
                setUpdated(json.updated ?? null);
                setStatus('ok');
            } else {
                setStatus('error');
            }
        } catch {
            setStatus('error');
        } finally {
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    // Build the converter's currency list from whatever the source returned.
    // TRY is always present (base); each foreign unit joins only if priced.
    const currencies = useMemo<Currency[]>(() => {
        const list: Currency[] = [{ code: 'TRY', label: 'الليرة التركية', flag: '🇹🇷', tryPerUnit: 1, decimals: 2 }];
        if (!data) return list;
        if (data.usd?.value) list.push({ code: 'USD', label: 'الدولار الأمريكي', flag: '🇺🇸', tryPerUnit: data.usd.value, decimals: 2 });
        if (data.eur?.value) list.push({ code: 'EUR', label: 'اليورو', flag: '🇪🇺', tryPerUnit: data.eur.value, decimals: 2 });
        if (data.sar?.value) list.push({ code: 'SAR', label: 'الريال السعودي', flag: '🇸🇦', tryPerUnit: data.sar.value, decimals: 2 });
        if (data.syp?.value && data.syp.value > 0) list.push({ code: 'SYP', label: 'الليرة السورية', flag: '🇸🇾', tryPerUnit: data.syp.value, decimals: 0 });
        if (data.gold?.value) list.push({ code: 'GOLD', label: 'غرام ذهب', flag: '🥇', tryPerUnit: data.gold.value, decimals: 3 });
        return list;
    }, [data]);

    const byCode = useMemo(() => Object.fromEntries(currencies.map((c) => [c.code, c])), [currencies]);

    // If a selected currency isn't offered by the loaded data (a source dropped
    // it), fall back to a safe pair. Guarded on `data` so the default USD→TRY
    // isn't clobbered to TRY during the loading phase, when only TRY exists yet.
    useEffect(() => {
        if (!data) return;
        if (!byCode[from]) setFrom(byCode['USD'] ? 'USD' : currencies[0].code);
        if (!byCode[to]) setTo('TRY');
    }, [data, currencies, byCode, from, to]);

    const amountNum = parseFloat(amount.replace(/,/g, '')) || 0;
    const fromC = byCode[from];
    const toC = byCode[to];
    const result = fromC && toC ? (amountNum * fromC.tryPerUnit) / toC.tryPerUnit : NaN;
    const unitRate = fromC && toC ? fromC.tryPerUnit / toC.tryPerUnit : NaN;

    const swap = () => { setFrom(to); setTo(from); };

    // Board cards — the headline rates in TRY.
    const board = useMemo(() => {
        if (!data) return [];
        const cards: { key: string; label: string; flag: string; rate: Rate | null; suffix: string; dec: number }[] = [
            { key: 'usd', label: 'الدولار', flag: '🇺🇸', rate: data.usd, suffix: 'ل.ت', dec: 2 },
            { key: 'eur', label: 'اليورو', flag: '🇪🇺', rate: data.eur, suffix: 'ل.ت', dec: 2 },
            { key: 'sar', label: 'الريال السعودي', flag: '🇸🇦', rate: data.sar, suffix: 'ل.ت', dec: 2 },
            { key: 'gold', label: 'غرام الذهب', flag: '🥇', rate: data.gold, suffix: 'ل.ت', dec: 2 },
        ];
        return cards.filter((c) => c.rate?.value);
    }, [data]);

    return (
        <main className="flex flex-col min-h-screen font-cairo">
            <PageHero
                title="أسعار الدولار واليورو مقابل الليرة التركية اليوم"
                description="سعر الدولار واليورو والريال والذهب مقابل الليرة التركية — محدّث تلقائياً، مع محوّل فوري"
                icon={<Coins className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
            />

            <div className="flex justify-center -mt-4 mb-4">
                <ShareMenu
                    title="أسعار الصرف اليوم في تركيا — محوّل العملات"
                    text="سعر الدولار واليورو والريال والذهب والليرة السورية مقابل الليرة التركية، محدّث تلقائياً مع محوّل فوري."
                    url={`${SITE_CONFIG.siteUrl}/tools/currency`}
                    variant="subtle"
                />
            </div>

            <section className="px-4 pb-12 flex-grow">
                <div className="max-w-3xl mx-auto space-y-5">

                    {/* ===== Live rates board ===== */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            <span className="relative inline-flex w-2 h-2">
                                <span className="absolute inline-flex w-2 h-2 rounded-full bg-emerald-500 opacity-75 animate-ping" />
                                <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
                            </span>
                            الأسعار مقابل الليرة التركية
                        </h2>
                        <button
                            onClick={() => load(true)}
                            disabled={refreshing || status === 'loading'}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 disabled:opacity-50 transition-colors"
                        >
                            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> تحديث
                        </button>
                    </div>

                    {status === 'error' ? (
                        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-5 flex items-start gap-3">
                            <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-black text-amber-800 dark:text-amber-300 text-sm">تعذّر جلب الأسعار الآن</p>
                                <p className="text-xs text-amber-700/80 dark:text-amber-400/70 mt-0.5">مصدر الأسعار مؤقّتاً غير متاح. جرّب «تحديث» بعد لحظات.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {status === 'loading'
                                ? Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                                ))
                                : board.map((c) => {
                                    const up = (c.rate!.change ?? 0) >= 0;
                                    const hasChange = !!c.rate!.change;
                                    return (
                                        <div key={c.key} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 shadow-sm">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                                                <span className="text-base leading-none">{c.flag}</span> {c.label}
                                            </div>
                                            <div className="text-lg font-black text-slate-900 dark:text-white tabular-nums leading-none" dir="ltr">
                                                {fmt(c.rate!.value, c.dec)}
                                                <span className="text-[10px] font-bold text-slate-400 mr-1">{c.suffix}</span>
                                            </div>
                                            {hasChange && (
                                                <div className={`mt-1.5 inline-flex items-center gap-0.5 text-[11px] font-black tabular-nums ${up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} dir="ltr">
                                                    {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                    {up ? '+' : ''}{fmt(c.rate!.change, 2)}%
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>
                    )}

                    {/* Syrian pound read-out — the way Syrians actually read it. */}
                    {status === 'ok' && (data?.sypUsd?.value || data?.sypTry?.value) && (
                        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                            <div className="text-xs font-black text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                                <span className="text-base leading-none">🇸🇾</span> الليرة السورية
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {data?.sypUsd?.value ? (
                                    <div>
                                        <div className="text-[11px] text-slate-400">الدولار الواحد =</div>
                                        <div className="font-black text-slate-900 dark:text-white tabular-nums" dir="ltr">{fmtSmart(data.sypUsd.value, 0)} <span className="text-[10px] text-slate-400">ل.س</span></div>
                                    </div>
                                ) : null}
                                {data?.sypTry?.value ? (
                                    <div>
                                        <div className="text-[11px] text-slate-400">الليرة التركية الواحدة =</div>
                                        <div className="font-black text-slate-900 dark:text-white tabular-nums" dir="ltr">{fmtSmart(data.sypTry.value, 0)} <span className="text-[10px] text-slate-400">ل.س</span></div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    )}

                    {/* ===== Converter ===== */}
                    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm">
                        <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                            <Wallet size={16} className="text-emerald-600" /> محوّل العملات
                        </h2>

                        <div className="space-y-3">
                            <div>
                                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block">المبلغ</label>
                                <input
                                    inputMode="decimal"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ''))}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-lg font-black tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                                    dir="ltr"
                                    placeholder="100"
                                />
                            </div>

                            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                                <div>
                                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block">من</label>
                                    <select
                                        value={from}
                                        onChange={(e) => setFrom(e.target.value)}
                                        className="w-full px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                                    >
                                        {currencies.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.label}</option>)}
                                    </select>
                                </div>

                                <button
                                    type="button"
                                    onClick={swap}
                                    aria-label="تبديل العملتين"
                                    className="mb-1 w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 active:scale-90 transition-all flex items-center justify-center shrink-0"
                                >
                                    <ArrowLeftRight size={18} />
                                </button>

                                <div>
                                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block">إلى</label>
                                    <select
                                        value={to}
                                        onChange={(e) => setTo(e.target.value)}
                                        className="w-full px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                                    >
                                        {currencies.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Result */}
                            <div className="rounded-xl bg-gradient-to-l from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-900/40 p-4">
                                <div className="text-[11px] font-bold text-emerald-700/70 dark:text-emerald-400/70 mb-1" dir="rtl">
                                    {fromC && toC ? `${fmtSmart(amountNum, 2)} ${fromC.label}` : '—'}
                                </div>
                                <div className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300 tabular-nums leading-none" dir="ltr">
                                    {toC ? `${fmtSmart(result, toC.decimals)}` : '—'}
                                    <span className="text-sm font-bold text-emerald-600/70 dark:text-emerald-400/60 mr-1.5">{toC?.label}</span>
                                </div>
                                {Number.isFinite(unitRate) && fromC && toC && (
                                    <div className="text-[11px] text-emerald-700/60 dark:text-emerald-400/60 mt-2 tabular-nums" dir="ltr">
                                        1 {fromC.code === 'GOLD' ? 'g' : fromC.code} = {fmtSmart(unitRate, toC.decimals)} {toC.code === 'GOLD' ? 'g' : toC.code}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {updated && (
                        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
                            آخر تحديث للأسعار: <span dir="ltr">{updated}</span> — تُحدَّث تلقائياً كل بضع دقائق
                        </p>
                    )}

                    {/* ===== SEO / explanatory content ===== */}
                    <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                        <h2 className="text-base font-black text-slate-800 dark:text-slate-100">أسعار صرف الليرة التركية اليوم</h2>
                        <p>
                            تعرض هذه الصفحة أحدث أسعار صرف الدولار الأمريكي (USD) واليورو (EUR) والريال السعودي (SAR)
                            وغرام الذهب مقابل الليرة التركية (TRY)، إضافةً إلى سعر الليرة السورية. الأسعار تُجلب من مصادر
                            مالية محدّثة وتتغيّر خلال اليوم، فاعتمدها كمؤشّر استرشادي؛ سعر الصرافة أو البنك الذي تتعامل معه
                            قد يختلف قليلاً بسبب هامش البيع والشراء والعمولات.
                        </p>
                        <p>
                            استعمل المحوّل أعلاه لتحويل أي مبلغ بين الليرة التركية والدولار واليورو والريال والليرة السورية
                            وغرام الذهب بضغطة واحدة. مثال: لمعرفة كم يساوي راتبك بالدولار، اختر «الليرة التركية» في خانة «من»
                            و«الدولار» في خانة «إلى».
                        </p>

                        <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 pt-1">أسئلة شائعة</h3>
                        <div className="space-y-3">
                            <div>
                                <p className="font-bold text-slate-800 dark:text-slate-200">كم سعر الدولار مقابل الليرة التركية اليوم؟</p>
                                <p className="text-slate-600 dark:text-slate-400">يظهر السعر الحالي في بطاقة «الدولار» أعلى الصفحة، محدّثاً تلقائياً. لأن السوق يتحرّك خلال اليوم، اضغط «تحديث» للحصول على آخر قيمة.</p>
                            </div>
                            <div>
                                <p className="font-bold text-slate-800 dark:text-slate-200">هل هذه الأسعار رسمية؟</p>
                                <p className="text-slate-600 dark:text-slate-400">الأسعار استرشادية من مصادر سوق حرّة، وليست سعراً رسمياً من البنك المركزي. للتحويلات الكبيرة قارن دائماً مع الصرافة أو البنك الذي ستتعامل معه.</p>
                            </div>
                            <div>
                                <p className="font-bold text-slate-800 dark:text-slate-200">كم يساوي غرام الذهب بالليرة التركية؟</p>
                                <p className="text-slate-600 dark:text-slate-400">تعرض بطاقة «غرام الذهب» السعر التقريبي بالليرة التركية، محسوباً من سعر الأونصة العالمي وسعر الدولار الحالي. سعر الصائغ الفعلي يضيف أجور الصياغة.</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-center pt-1">
                        <Link href="/tools" className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600 hover:text-emerald-700">
                            كل الأدوات <ChevronLeft size={15} />
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
