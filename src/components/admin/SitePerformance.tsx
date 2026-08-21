'use client';

/**
 * SitePerformance — first-party Core Web Vitals, measured on OUR visitors.
 *
 * Search Console reports "not enough data" because CrUX needs a high volume of
 * Chrome-telemetry samples per URL group; our traffic is spread across 1500+
 * URLs. This panel does not depend on CrUX, on Google Analytics, or on the
 * cookie-consent switch — it reads the anonymous `web_vital` rows our own pages
 * send for every visitor. It is deliberately action-first: the headline numbers
 * are p75 (the value Google grades), and the list underneath names the exact
 * pages to fix instead of just saying "the site is slow".
 */

import { useCallback, useEffect, useState } from 'react';
import { Gauge, RefreshCw, AlertTriangle, CheckCircle2, ChevronDown } from 'lucide-react';

type Overall = { lcp: number | null; cls: number | null; inp: number | null; fcp: number | null; ttfb: number | null };
type PageRow = { path: string; samples: number; lcp: number | null; cls: number | null; inp: number | null };
type ConnRow = { conn: string; samples: number; lcp: number | null };
type Payload = { ok?: boolean; days?: number; samples?: number; overall?: Overall; pages?: PageRow[]; connections?: ConnRow[] };

// Google's official thresholds: [good, needs-improvement] upper bounds.
const T = {
    lcp: [2500, 4000],
    inp: [200, 500],
    cls: [0.1, 0.25],
    fcp: [1800, 3000],
    ttfb: [800, 1800],
} as const;

function grade(metric: keyof typeof T, v: number | null): 'good' | 'ni' | 'poor' | 'none' {
    if (v == null) return 'none';
    const [g, n] = T[metric];
    return v <= g ? 'good' : v <= n ? 'ni' : 'poor';
}

const TONE: Record<string, string> = {
    good: 'text-emerald-600 dark:text-emerald-400',
    ni: 'text-amber-600 dark:text-amber-400',
    poor: 'text-rose-600 dark:text-rose-400',
    none: 'text-slate-400',
};
const DOT: Record<string, string> = {
    good: 'bg-emerald-500', ni: 'bg-amber-500', poor: 'bg-rose-500', none: 'bg-slate-300',
};

const fmtMs = (v: number | null) => (v == null ? '—' : v >= 1000 ? `${(v / 1000).toFixed(2)}ث` : `${v}ms`);
const fmtCls = (v: number | null) => (v == null ? '—' : v.toFixed(3));

export default function SitePerformance() {
    const [data, setData] = useState<Payload | null>(null);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/vitals?days=28');
            if (!res.ok) throw new Error(String(res.status));
            setData(await res.json());
            setFailed(false);
        } catch {
            setFailed(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const o = data?.overall;
    const samples = data?.samples ?? 0;

    const HEADLINE: { key: keyof typeof T; label: string; hint: string; value: number | null; fmt: (v: number | null) => string }[] = [
        { key: 'lcp', label: 'LCP', hint: 'سرعة ظهور المحتوى الأكبر', value: o?.lcp ?? null, fmt: fmtMs },
        { key: 'inp', label: 'INP', hint: 'سرعة الاستجابة للنقر', value: o?.inp ?? null, fmt: fmtMs },
        { key: 'cls', label: 'CLS', hint: 'ثبات العناصر أثناء التحميل', value: o?.cls ?? null, fmt: fmtCls },
    ];
    const issueCount = HEADLINE.filter((m) => {
        const result = grade(m.key, m.value);
        return result === 'ni' || result === 'poor';
    }).length;

    return (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                    <h2 className="text-[11px] font-black text-slate-600 dark:text-slate-300 tracking-[0.15em] uppercase flex items-center gap-1.5">
                        <Gauge size={13} className="text-emerald-600" /> صحة الموقع
                    </h2>
                    {!loading && !failed && samples > 0 && (
                        <p className={`mt-1 text-[11px] font-bold ${issueCount === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {issueCount === 0 ? 'السرعة والاستجابة والثبات جيدة' : `${issueCount} مؤشرات تحتاج انتباهاً`}
                            <span className="text-slate-400 font-medium"> · آخر 28 يوماً</span>
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={load} aria-label="تحديث" className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                    </button>
                    {!loading && !failed && samples > 0 && (
                        <button
                            onClick={() => setExpanded((value) => !value)}
                            aria-expanded={expanded}
                            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-black text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            التفاصيل
                            <ChevronDown size={13} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="mt-3 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ) : failed ? (
                <p className="mt-3 text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    <AlertTriangle size={13} className="text-amber-500" /> تعذّر تحميل بيانات الأداء.
                </p>
            ) : samples === 0 ? (
                <p className="mt-3 text-xs font-bold text-slate-500 leading-6">
                    لا توجد قياسات بعد. القياس يبدأ تلقائياً مع أول الزيارات بعد النشر — راجع الصفحة بعد ساعات.
                </p>
            ) : !expanded ? (
                <div className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${issueCount === 0 ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400'}`}>
                    {issueCount === 0 ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                    {issueCount === 0 ? 'لا يوجد خلل ظاهر يحتاج تدخلاً الآن.' : 'افتح التفاصيل لمعرفة المؤشرات والصفحات الأولى بالإصلاح.'}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4 mb-4">
                        {HEADLINE.map((m) => {
                            const g = grade(m.key, m.value);
                            return (
                                <div key={m.key} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span className={`w-1.5 h-1.5 rounded-full ${DOT[g]}`} />
                                        <span className="text-[10px] font-black tracking-wider text-slate-500">{m.label}</span>
                                    </div>
                                    <p className={`text-lg font-black tabular-nums leading-none ${TONE[g]}`} dir="ltr">{m.fmt(m.value)}</p>
                                    <p className="text-[10px] font-bold text-slate-400 leading-tight mt-1">{m.hint}</p>
                                </div>
                            );
                        })}
                    </div>

                    {data?.pages && data.pages.length > 0 && (
                        <div>
                            <h3 className="text-[10px] font-black text-slate-500 tracking-[0.15em] uppercase mb-2">أبطأ الصفحات (الأولى بالإصلاح)</h3>
                            <div className="space-y-1">
                                {data.pages.slice(0, 6).map((p) => {
                                    const g = grade('lcp', p.lcp);
                                    return (
                                        <div key={p.path} className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/40">
                                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate" dir="ltr">{p.path}</span>
                                            <span className="flex items-center gap-2 shrink-0">
                                                <span className="text-[10px] font-bold text-slate-400 tabular-nums">{p.samples}</span>
                                                <span className={`text-[11px] font-black tabular-nums ${TONE[g]}`} dir="ltr">{fmtMs(p.lcp)}</span>
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {data?.connections && data.connections.length > 1 && (
                        <p className="mt-3 text-[10px] font-bold text-slate-400 leading-5">
                            حسب الشبكة:{' '}
                            {data.connections.map((c) => `${c.conn} ${fmtMs(c.lcp)}`).join(' · ')}
                        </p>
                    )}
                </>
            )}
        </div>
    );
}
