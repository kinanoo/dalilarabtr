'use client';

import { useState, useMemo } from 'react';
import {
    CalendarClock, Plane, Plus, Trash2, Info, ExternalLink,
    ChevronDown, HelpCircle, CalendarDays, Timer, ListChecks,
} from 'lucide-react';
import Link from 'next/link';
import PageHero from '@/components/PageHero';
import ShareMenu from '@/components/ShareMenu';
import { SITE_CONFIG } from '@/lib/config';
import CrossLinks from '@/components/seo/CrossLinks';

type Trip = { id: string; from: string; to: string };

const DAY_MS = 1000 * 60 * 60 * 24;

// Whole days between two ISO dates (to − from). Returns 0 for invalid/negative.
function daysBetween(fromIso: string, toIso: string): number {
    if (!fromIso || !toIso) return 0;
    const a = new Date(fromIso + 'T00:00:00Z').getTime();
    const b = new Date(toIso + 'T00:00:00Z').getTime();
    if (isNaN(a) || isNaN(b) || b < a) return 0;
    return Math.round((b - a) / DAY_MS);
}

function fmt(n: number): string {
    return new Intl.NumberFormat('en-US').format(n);
}

let seq = 0;
const newTrip = (): Trip => ({ id: `t${seq++}`, from: '', to: '' });

export default function ResidenceCalculatorClient() {
    const [trips, setTrips] = useState<Trip[]>([newTrip()]);
    const [guideOpen, setGuideOpen] = useState(false);

    const todayIso = useMemo(() => new Date().toISOString().split('T')[0], []);

    const update = (id: string, key: 'from' | 'to', value: string) =>
        setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, [key]: value } : t)));
    const addTrip = () => setTrips((prev) => [...prev, newTrip()]);
    const removeTrip = (id: string) =>
        setTrips((prev) => (prev.length > 1 ? prev.filter((t) => t.id !== id) : prev));

    const stats = useMemo(() => {
        const valid = trips.filter((t) => t.from && t.to && daysBetween(t.from, t.to) > 0);
        const durations = valid.map((t) => daysBetween(t.from, t.to));
        const totalAbsent = durations.reduce((a, b) => a + b, 0);
        const longest = durations.length ? Math.max(...durations) : 0;

        // Absent days that fall within the last 365 days (rolling window from today).
        const windowStart = new Date(Date.now() - 365 * DAY_MS).getTime();
        const now = Date.now();
        let absentLast365 = 0;
        for (const t of valid) {
            const s = Math.max(new Date(t.from + 'T00:00:00Z').getTime(), windowStart);
            const e = Math.min(new Date(t.to + 'T00:00:00Z').getTime(), now);
            if (e > s) absentLast365 += Math.round((e - s) / DAY_MS);
        }
        return { trips: valid.length, totalAbsent, longest, absentLast365 };
    }, [trips]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo" dir="rtl">
            <PageHero
                title="حاسبة أيام الإقامة والغياب عن تركيا"
                description="احسب مجموع أيام غيابك عن تركيا وأطول فترة غياب — لمتابعة شرط الإقامة المتّصلة للجنسية أو الإقامة طويلة الأمد."
                icon={<CalendarClock className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
                titleClassName="md:text-4xl"
            />

            <div className="max-w-3xl mx-auto px-4 py-10 w-full">
                {/* Input card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-7">
                    <div className="flex items-center gap-2 mb-1">
                        <Plane size={18} className="text-emerald-600" />
                        <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">فترات الغياب (خارج تركيا)</h2>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                        أدخل تاريخ خروجك من تركيا وتاريخ عودتك لكل سفرة. أضف كل رحلاتك للحصول على المجموع.
                    </p>

                    <div className="space-y-3">
                        {trips.map((t, i) => {
                            const d = daysBetween(t.from, t.to);
                            const invalid = t.from && t.to && d === 0;
                            return (
                                <div key={t.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 p-3 sm:p-4">
                                    <div className="flex items-center justify-between mb-2.5">
                                        <span className="text-xs font-black text-slate-500 dark:text-slate-400">سفرة {i + 1}</span>
                                        {trips.length > 1 && (
                                            <button
                                                onClick={() => removeTrip(t.id)}
                                                aria-label={`حذف السفرة ${i + 1}`}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <label className="block">
                                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">تاريخ الخروج من تركيا</span>
                                            <input
                                                type="date"
                                                max={t.to || todayIso}
                                                value={t.from}
                                                onChange={(e) => update(t.id, 'from', e.target.value)}
                                                className="w-full h-11 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                                                dir="ltr"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">تاريخ العودة إلى تركيا</span>
                                            <input
                                                type="date"
                                                min={t.from || undefined}
                                                max={todayIso}
                                                value={t.to}
                                                onChange={(e) => update(t.id, 'to', e.target.value)}
                                                className="w-full h-11 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                                                dir="ltr"
                                            />
                                        </label>
                                    </div>
                                    {d > 0 && (
                                        <p className="mt-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                            = {fmt(d)} يوم غياب
                                        </p>
                                    )}
                                    {invalid && (
                                        <p className="mt-2 text-xs font-bold text-rose-600 dark:text-rose-400">
                                            تأكّد أن تاريخ العودة بعد تاريخ الخروج.
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <button
                        onClick={addTrip}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-sm font-black border border-emerald-200 dark:border-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                    >
                        <Plus size={16} /> إضافة سفرة أخرى
                    </button>
                </div>

                {/* Results */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
                    {[
                        { icon: Timer, label: 'إجمالي أيام الغياب', value: fmt(stats.totalAbsent), tone: 'emerald' },
                        { icon: CalendarDays, label: 'أطول فترة غياب', value: `${fmt(stats.longest)} يوم`, tone: 'blue' },
                        { icon: ListChecks, label: 'عدد السفرات', value: fmt(stats.trips), tone: 'slate' },
                        { icon: CalendarClock, label: 'الغياب آخر 12 شهراً', value: `${fmt(stats.absentLast365)} يوم`, tone: 'amber' },
                    ].map((s) => (
                        <div key={s.label} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-center">
                            <s.icon size={18} className={`mx-auto mb-2 ${s.tone === 'emerald' ? 'text-emerald-600' : s.tone === 'blue' ? 'text-blue-500' : s.tone === 'amber' ? 'text-amber-500' : 'text-slate-400'}`} />
                            <div className="text-xl font-black text-slate-900 dark:text-slate-50 tabular-nums">{s.value}</div>
                            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Reference card — cited, general information (not personalised legal advice) */}
                <div className="mt-6 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/70 dark:bg-blue-950/20 p-5">
                    <div className="flex items-start gap-3">
                        <Info size={20} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <div className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed space-y-2">
                            <p className="font-black text-slate-900 dark:text-slate-100">لماذا تهمّ أيام الغياب؟</p>
                            <p>
                                عند التقديم على <strong>الجنسية عبر الإقامة</strong> أو على <strong>الإقامة طويلة الأمد</strong> تشترط دائرة الهجرة التركية «إقامة متّصلة»؛ والغياب الطويل قد يقطع هذا الاتصال أو يُطلب تعويضه. تختلف التفاصيل حسب حالتك ونوع إقامتك.
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                هذه الحاسبة تعدّ الأيام فقط لمساعدتك على المتابعة، وليست استشارة قانونية. تحقّق دائماً من العتبات الرسمية المحدّثة عبر دائرة الهجرة.
                            </p>
                            <a
                                href="https://www.goc.gov.tr/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-black text-xs hover:underline"
                            >
                                <ExternalLink size={13} /> الموقع الرسمي لدائرة الهجرة (goc.gov.tr)
                            </a>
                        </div>
                    </div>
                </div>

                {/* Share */}
                <div className="mt-6 flex justify-center">
                    <ShareMenu
                        url={`${SITE_CONFIG.siteUrl}/tools/residence-calculator`}
                        title="حاسبة أيام الإقامة والغياب عن تركيا"
                    />
                </div>

                {/* How-to / guide */}
                <div className="mt-8">
                    <button
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
                            <p>1. لكل مرّة سافرت فيها خارج تركيا، أدخل <strong>تاريخ الخروج</strong> و<strong>تاريخ العودة</strong> (كما في أختام الجواز أو سجل الحدود).</p>
                            <p>2. اضغط «إضافة سفرة أخرى» لكل رحلة إضافية.</p>
                            <p>3. تظهر النتائج فوراً: إجمالي أيام الغياب، أطول فترة، والغياب خلال آخر 12 شهراً.</p>
                            <p>يمكنك التحقّق من تواريخ دخولك وخروجك الرسمية من سجل الحدود عبر بوابة <strong>e-Devlet</strong> (خدمة Yurda Giriş-Çıkış).</p>
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
