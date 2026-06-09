'use client';

/**
 * /admin/feedback — article reader-feedback dashboard.
 *
 * Reads from the article_feedback table (admin can SELECT via the
 * is_admin() RLS policy) and joins against articles to give the
 * admin a single screen showing which articles readers loved, which
 * they marked unhelpful, and which need rewriting.
 *
 * The "problem score" is a weighted-down ratio: a column that highlights
 * articles where the unhelpful share dominates AND the total sample
 * size is large enough to trust. Five 👎 with no 👍 is suspicious; 30
 * 👎 with 100 👍 means the content is mostly fine and 30 readers were
 * outliers — the score reflects that.
 */

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import {
    ThumbsUp, ThumbsDown, AlertTriangle, ExternalLink, Loader2,
    Search, RefreshCcw, Filter, ArrowUpDown,
} from 'lucide-react';
import { toast } from 'sonner';
import logger from '@/lib/logger';

type Row = {
    article_id: string;
    title: string;
    slug: string | null;
    up: number;
    down: number;
    total: number;
    // 0..100 — higher means more attention needed
    problemScore: number;
    lastVoteAt: string | null;
};

type SortKey = 'problem' | 'total' | 'down' | 'recent';

function computeProblemScore(up: number, down: number): number {
    if (up + down === 0) return 0;
    const total = up + down;
    const downShare = down / total;
    // Trust the signal more as the sample size grows. log-scaled so the first
    // ten votes matter and the next thousand only refine the score a little.
    const sampleWeight = Math.min(1, Math.log10(total + 1) / 2);
    return Math.round(downShare * sampleWeight * 100);
}

export default function AdminFeedbackPage() {
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<SortKey>('problem');
    const [onlyProblems, setOnlyProblems] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            if (!supabase) { setLoading(false); return; }
            setLoading(true);
            try {
                // Admin can SELECT every row via the is_admin() policy installed
                // in the 2026-06-05 RLS hardening migration.
                const { data: feedback, error: fbErr } = await supabase
                    .from('article_feedback')
                    .select('article_id, helpful, created_at');
                if (fbErr) throw fbErr;

                if (!feedback || feedback.length === 0) {
                    if (!cancelled) {
                        setRows([]);
                        setLoading(false);
                    }
                    return;
                }

                // Aggregate per article in JS — sample sizes are small for now
                // (typical site totals well under 10k votes), so this is cheaper
                // than a round-trip to an RPC.
                const buckets = new Map<string, { up: number; down: number; lastVoteAt: string | null }>();
                for (const f of feedback as Array<{ article_id: string; helpful: boolean; created_at: string }>) {
                    const b = buckets.get(f.article_id) ?? { up: 0, down: 0, lastVoteAt: null };
                    if (f.helpful) b.up += 1;
                    else b.down += 1;
                    if (!b.lastVoteAt || f.created_at > b.lastVoteAt) b.lastVoteAt = f.created_at;
                    buckets.set(f.article_id, b);
                }

                const articleIds = Array.from(buckets.keys());
                const { data: articles, error: artErr } = await supabase
                    .from('articles')
                    .select('id, title, slug')
                    .in('id', articleIds);
                if (artErr) throw artErr;

                const meta = new Map<string, { title: string; slug: string | null }>();
                for (const a of (articles || []) as Array<{ id: string; title: string; slug: string | null }>) {
                    meta.set(a.id, { title: a.title, slug: a.slug });
                }

                const result: Row[] = Array.from(buckets.entries()).map(([article_id, b]) => {
                    const m = meta.get(article_id);
                    return {
                        article_id,
                        title: m?.title ?? article_id,
                        slug: m?.slug ?? null,
                        up: b.up,
                        down: b.down,
                        total: b.up + b.down,
                        problemScore: computeProblemScore(b.up, b.down),
                        lastVoteAt: b.lastVoteAt,
                    };
                });

                if (!cancelled) setRows(result);
            } catch (err) {
                logger.error('Loading feedback failed:', err);
                if (!cancelled) toast.error('فشل تحميل آراء القرّاء');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [refreshKey]);

    const filtered = useMemo(() => {
        let r = rows;
        if (onlyProblems) r = r.filter((x) => x.problemScore >= 25);
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            r = r.filter((x) => x.title.toLowerCase().includes(q) || x.article_id.toLowerCase().includes(q));
        }
        const sorted = [...r];
        if (sortBy === 'problem') sorted.sort((a, b) => b.problemScore - a.problemScore || b.total - a.total);
        else if (sortBy === 'total') sorted.sort((a, b) => b.total - a.total);
        else if (sortBy === 'down') sorted.sort((a, b) => b.down - a.down || b.total - a.total);
        else if (sortBy === 'recent') sorted.sort((a, b) => (b.lastVoteAt || '').localeCompare(a.lastVoteAt || ''));
        return sorted;
    }, [rows, search, sortBy, onlyProblems]);

    const totals = useMemo(() => {
        let up = 0, down = 0, problems = 0;
        for (const r of rows) {
            up += r.up; down += r.down;
            if (r.problemScore >= 25) problems += 1;
        }
        return { up, down, problems, articles: rows.length };
    }, [rows]);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-800 dark:text-white">
                        <span className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg text-emerald-600">
                            <ThumbsUp size={22} />
                        </span>
                        آراء القرّاء على المقالات
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                        تقييمات "هل كان المقال مفيداً؟" مرتّبة لتظهر المقالات التي تحتاج تحسيناً أولاً.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setRefreshKey((k) => k + 1)}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:border-emerald-500 transition disabled:opacity-50"
                >
                    <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                    تحديث
                </button>
            </header>

            {/* Summary cards */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <SummaryCard label="مقال صوّت عليه قارئ" value={totals.articles} accent="slate" />
                <SummaryCard label="👍 مفيد" value={totals.up} accent="emerald" />
                <SummaryCard label="👎 غير مفيد" value={totals.down} accent="amber" />
                <SummaryCard label="⚠️ يحتاج تحسيناً" value={totals.problems} accent="red" />
            </section>

            {/* Controls */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="relative flex-1">
                    <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="ابحث بعنوان المقال…"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pr-10 pl-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                </div>
                <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm cursor-pointer">
                    <input
                        type="checkbox"
                        checked={onlyProblems}
                        onChange={(e) => setOnlyProblems(e.target.checked)}
                        className="accent-red-500"
                    />
                    <Filter size={16} className="text-red-500" />
                    تحتاج تحسيناً فقط
                </label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm">
                    <ArrowUpDown size={16} className="text-slate-500" />
                    <span className="text-slate-500">رتّب بـ:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortKey)}
                        className="bg-transparent font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                    >
                        <option value="problem">الأكثر إشكالاً</option>
                        <option value="total">الأكثر تصويتاً</option>
                        <option value="down">الأكثر سلبية</option>
                        <option value="recent">الأحدث</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>
            ) : rows.length === 0 ? (
                <EmptyState />
            ) : filtered.length === 0 ? (
                <NoMatchState />
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                                <tr>
                                    <th className="text-right py-3 px-4">المقال</th>
                                    <th className="text-center py-3 px-3 w-20">👍</th>
                                    <th className="text-center py-3 px-3 w-20">👎</th>
                                    <th className="text-center py-3 px-3 w-24">إجمالي</th>
                                    <th className="text-center py-3 px-3 w-28">إشكالية</th>
                                    <th className="text-center py-3 px-3 w-24">إجراء</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((r) => (
                                    <FeedbackRow key={r.article_id} row={r} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function FeedbackRow({ row }: { row: Row }) {
    const danger = row.problemScore >= 25;
    const warn = row.problemScore >= 10 && row.problemScore < 25;
    return (
        <tr className={`border-t border-slate-100 dark:border-slate-800 ${danger ? 'bg-red-50/40 dark:bg-red-900/10' : ''}`}>
            <td className="py-3 px-4">
                <div className="flex items-start gap-2">
                    {danger && <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />}
                    <div className="min-w-0">
                        <Link
                            href={`/article/${row.slug || row.article_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-slate-800 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition truncate block"
                        >
                            {row.title}
                        </Link>
                        <div className="text-[11px] text-slate-400 font-mono truncate" dir="ltr">{row.article_id}</div>
                    </div>
                </div>
            </td>
            <td className="text-center font-bold text-emerald-600 dark:text-emerald-400">{row.up}</td>
            <td className={`text-center font-bold ${danger ? 'text-red-600 dark:text-red-400' : 'text-slate-500'}`}>{row.down}</td>
            <td className="text-center text-slate-600 dark:text-slate-300 font-bold">{row.total}</td>
            <td className="text-center">
                <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-md text-xs font-bold ${
                    danger
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                        : warn
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                }`}>
                    {row.problemScore}
                </span>
            </td>
            <td className="text-center">
                <Link
                    href={`/admin/articles/${encodeURIComponent(row.article_id)}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                    title="فتح للتحرير"
                >
                    <ExternalLink size={14} /> تحرير
                </Link>
            </td>
        </tr>
    );
}

function SummaryCard({ label, value, accent }: { label: string; value: number; accent: 'slate' | 'emerald' | 'amber' | 'red' }) {
    const accents: Record<string, string> = {
        slate: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200',
        emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
        amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
        red: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
    };
    return (
        <div className={`${accents[accent]} rounded-2xl p-4 border border-slate-100 dark:border-slate-800`}>
            <div className="text-xs font-bold opacity-70">{label}</div>
            <div className="text-3xl font-black mt-1 leading-none">{value.toLocaleString('en-US')}</div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-12 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 mb-4">
                <ThumbsUp size={28} />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">لا توجد تقييمات بعد</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                ستظهر الأصوات هنا حالما يصوّت قرّاؤك على المقالات عبر زر "هل كان المقال مفيداً؟" أسفل كل مقال.
            </p>
        </div>
    );
}

function NoMatchState() {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500 dark:text-slate-400 text-sm font-bold">
            لا توجد مقالات مطابقة لبحثك.
        </div>
    );
}
