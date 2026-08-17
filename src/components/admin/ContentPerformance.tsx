'use client';

/**
 * ContentPerformance — "كم قرأه الناس؟" for each thing the owner publishes.
 *
 * SitePulse answers "how is the site doing" with one number for everything.
 * This answers the question that number can't: the owner published a news item
 * this morning — did anyone read it? It lists the newest articles, news and
 * services with per-item readers today, readers this week, and lifetime views.
 *
 * One RPC call returns the whole panel (site totals + the item list). The
 * Supabase quota is finite and this panel sits under a dashboard the owner
 * leaves open, so it deliberately does NOT poll on a timer like SitePulse —
 * it loads once and refreshes on demand. Publishing is not a per-30-seconds
 * event; a manual refresh button matches how the data actually changes.
 *
 * Honest numbers, deliberately:
 *   • readers today / this week are TRUE unique readers from raw events, and
 *     include visitors who never accepted tracking (cookieless anon_key).
 *   • lifetime is VIEWS, not readers. Raw events are pruned at 45 days, so
 *     deduplicating one person across months is impossible after the fact.
 *     Summing daily uniques would give "reader-days" dressed up as readers —
 *     a number that looks precise and isn't. We show what we can defend.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Eye, Users, RefreshCw, FileText, Newspaper, Store, ArrowUpRight,
    BarChart3, Info,
} from 'lucide-react';

type Kind = 'article' | 'update' | 'service';

interface Item {
    kind: Kind;
    title: string | null;
    path: string;
    published_at: string | null;
    views_today: number | string;
    readers_today: number | string;
    views_week: number | string;
    readers_week: number | string;
    views_total: number | string;
    first_day: string | null;
}
interface SiteTotals {
    views_today?: number | string;
    readers_today?: number | string;
    views_week?: number | string;
    readers_week?: number | string;
    views_total?: number | string;
    pages_tracked?: number | string;
    tracking_since?: string | null;
}
interface Payload { site?: SiteTotals; items?: Item[] }

const num = (v: number | string | undefined | null): number => Number(v ?? 0);
const fmt = (v: number | string | undefined | null): string => num(v).toLocaleString('en-US');

const KIND: Record<Kind, { label: string; icon: React.ElementType; cls: string }> = {
    article: { label: 'مقال',  icon: FileText,  cls: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30' },
    update:  { label: 'خبر',   icon: Newspaper, cls: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30' },
    service: { label: 'خدمة',  icon: Store,     cls: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30' },
};

// "منذ ساعتين" / "قبل 3 أيام" — the owner thinks in "what did I publish today",
// so age is more useful here than a calendar date.
function since(iso: string | null): string {
    if (!iso) return '—';
    const ms = Date.now() - new Date(iso).getTime();
    if (!Number.isFinite(ms) || ms < 0) return '—';
    const h = Math.floor(ms / 3_600_000);
    if (h < 1) return 'الآن';
    if (h < 24) return `قبل ${h} ساعة`;
    const d = Math.floor(h / 24);
    if (d < 30) return `قبل ${d} يوم`;
    const mo = Math.floor(d / 30);
    if (mo < 12) return `قبل ${mo} شهر`;
    return `قبل ${Math.floor(mo / 12)} سنة`;
}

type Range = 'today' | 'week';

export default function ContentPerformance() {
    const [data, setData] = useState<Payload | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [failed, setFailed] = useState(false);
    const [range, setRange] = useState<Range>('today');
    const [kind, setKind] = useState<Kind | 'all'>('all');

    const load = useCallback(async (silent = false) => {
        if (!supabase) { setLoading(false); return; }
        if (silent) setBusy(true); else setLoading(true);
        const { data: res, error } = await supabase.rpc('get_content_performance', { p_limit: 40 });
        // A missing function means the migration has not been applied yet; the
        // panel says so plainly instead of rendering a wall of zeros.
        setFailed(Boolean(error) || !res);
        if (!error && res) setData(res as Payload);
        setLoading(false);
        setBusy(false);
    }, []);

    useEffect(() => { void load(); }, [load]);

    const site = data?.site ?? {};
    const items = (data?.items ?? []).filter((i) => kind === 'all' || i.kind === kind);

    const readersKey = range === 'today' ? 'readers_today' : 'readers_week';
    const viewsKey   = range === 'today' ? 'views_today'   : 'views_week';

    // Ranked by the selected window so "what worked today" is the top row —
    // the newest item is not always the one being read.
    const ranked = [...items].sort((a, b) => num(b[readersKey]) - num(a[readersKey]));
    const max = Math.max(1, ...ranked.map((i) => num(i[readersKey])));

    const totals = [
        { label: 'قرّاء اليوم',        value: fmt(site.readers_today), sub: 'شخص فريد',        icon: Users, cls: 'from-blue-500 to-cyan-600' },
        { label: 'مشاهدات اليوم',      value: fmt(site.views_today),   sub: 'صفحة',            icon: Eye,   cls: 'from-violet-500 to-purple-600' },
        { label: 'قرّاء آخر 7 أيام',   value: fmt(site.readers_week),  sub: 'شخص فريد',        icon: Users, cls: 'from-emerald-500 to-teal-600' },
        { label: 'إجمالي المشاهدات',   value: fmt(site.views_total),   sub: site.tracking_since ? `منذ ${site.tracking_since}` : 'كل الصفحات', icon: BarChart3, cls: 'from-amber-500 to-orange-600' },
    ];

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
                <h2 className="text-[11px] font-black text-blue-600 dark:text-blue-400 flex items-center gap-1.5 tracking-[0.2em] uppercase">
                    <BarChart3 size={13} />
                    ماذا قرأ الناس — لكل منشور على حدة
                </h2>
                <button
                    onClick={() => load(true)}
                    disabled={busy}
                    className="text-[11px] font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1 disabled:opacity-50 transition-colors"
                >
                    <RefreshCw size={12} className={busy ? 'animate-spin' : ''} /> تحديث
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    ))}
                </div>
            ) : failed ? (
                <div className="rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
                    <p className="text-[12px] font-bold text-amber-800 dark:text-amber-300">
                        لم تُطبَّق بعد دالة <code className="font-mono">get_content_performance</code> على القاعدة.
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                        تُطبَّق تلقائياً عند دمج <code className="font-mono">sql/2026-08-15_content_performance.sql</code> في <code className="font-mono">main</code>. اضغط «تحديث» بعد اكتمال التطبيق.
                    </p>
                </div>
            ) : (
                <>
                    {/* Site-wide totals — the context that makes one item's number readable. */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                        {totals.map((c) => {
                            const Icon = c.icon;
                            return (
                                <div key={c.label} className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 shadow-sm">
                                    <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-l ${c.cls}`} />
                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br ${c.cls} text-white shadow-sm mb-1.5`}>
                                        <Icon size={15} />
                                    </span>
                                    <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums leading-none">{c.value}</div>
                                    <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mt-1">{c.label}</div>
                                    <div className="text-[10px] text-slate-400">{c.sub}</div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-[11px] font-black">
                            {([['today', 'اليوم'], ['week', 'آخر 7 أيام']] as const).map(([k, label]) => (
                                <button
                                    key={k}
                                    onClick={() => setRange(k)}
                                    className={`px-3 py-1 transition-colors ${range === k ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-blue-600'}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-[11px] font-black">
                            {([['all', 'الكل'], ['update', 'أخبار'], ['article', 'مقالات'], ['service', 'خدمات']] as const).map(([k, label]) => (
                                <button
                                    key={k}
                                    onClick={() => setKind(k)}
                                    className={`px-2.5 py-1 transition-colors ${kind === k ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* The list */}
                    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
                        {ranked.length === 0 ? (
                            <p className="text-[12px] text-slate-400 p-6 text-center">لا منشورات في هذا التصنيف بعد.</p>
                        ) : (
                            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                                {ranked.map((it) => {
                                    const meta = KIND[it.kind];
                                    const Icon = meta?.icon ?? FileText;
                                    const readers = num(it[readersKey]);
                                    const views = num(it[viewsKey]);
                                    return (
                                        <li key={it.path} className="p-3 sm:p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                            <div className="flex items-start gap-3">
                                                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg shrink-0 mt-0.5 ${meta?.cls ?? ''}`}>
                                                    <Icon size={13} />
                                                </span>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-baseline gap-2 flex-wrap">
                                                        <a
                                                            href={it.path}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2"
                                                        >
                                                            {it.title || it.path}
                                                            <ArrowUpRight size={11} className="inline mr-0.5 opacity-50" />
                                                        </a>
                                                        <span className="text-[10px] font-bold text-slate-400 shrink-0">
                                                            {meta?.label} · نُشر {since(it.published_at)}
                                                        </span>
                                                    </div>

                                                    {/* Proportion bar, scaled to the best performer in this window. */}
                                                    <div className="h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-2">
                                                        <div
                                                            className="h-full rounded-full bg-gradient-to-l from-blue-400 to-cyan-500"
                                                            style={{ width: `${Math.round((readers / max) * 100)}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-left">
                                                    <div className="min-w-[3.2rem]">
                                                        <div className="text-base font-black text-slate-900 dark:text-white tabular-nums leading-none">{fmt(readers)}</div>
                                                        <div className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400">قارئ</div>
                                                    </div>
                                                    <div className="min-w-[3.2rem]">
                                                        <div className="text-base font-black text-slate-500 dark:text-slate-400 tabular-nums leading-none">{fmt(views)}</div>
                                                        <div className="text-[9.5px] font-bold text-slate-400">مشاهدة</div>
                                                    </div>
                                                    <div className="min-w-[3.6rem] hidden sm:block">
                                                        <div className="text-base font-black text-amber-600 dark:text-amber-400 tabular-nums leading-none">{fmt(it.views_total)}</div>
                                                        <div className="text-[9.5px] font-bold text-slate-400">إجمالاً</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    {/* dark:text-slate-400 not -500: on the dark ground the
                        darker grey loses contrast — pinned by paletteContrast. */}
                    <p className="flex items-start gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        <Info size={12} className="shrink-0 mt-0.5" />
                        <span>
                            «قارئ» = شخص فريد فعلاً، ويشمل من لم يوافق على التتبّع (مفتاح مجهول يتبدّل يومياً، لا يُخزَّن على جهاز أحد).
                            و«إجمالاً» عدد <strong>مشاهدات</strong> لا أشخاص: الأحداث الخام تُحذف بعد 45 يوماً، فدمج الشخص نفسه عبر شهور صار مستحيلاً — وجمع الأيام كان سيعطي «قارئ-يوم» بثوب قارئ.
                            الترتيب بحسب النافذة المختارة لا بتاريخ النشر، فالأحدث ليس دائماً الأكثر قراءةً.
                        </span>
                    </p>
                </>
            )}
        </div>
    );
}
