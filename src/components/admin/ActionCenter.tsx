'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Briefcase, FileText, MessageCircle, CheckCircle,
    Check, XCircle, Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

/**
 * ActionCenter — the ONE thing an admin opens the dashboard for: "what needs me
 * right now?". It shows only real approval queues that fall to zero when the
 * admin acts on them — pending service/join submissions, pending member
 * articles, pending comments. No "since your last visit" vanity, no "an article
 * you published 2h ago" echo: knowing your own past publishing is not a task.
 * Everything is one compact row of cards so the dashboard stays "ملمومة".
 */

type QueueCounts = { services: number; articles: number; comments: number };

export function ActionCenter() {
    const [counts, setCounts] = useState<QueueCounts>({ services: 0, articles: 0, comments: 0 });
    const [loading, setLoading] = useState(true);
    const [batchLoading, setBatchLoading] = useState<'approve' | 'reject' | null>(null);

    const fetchCounts = useCallback(async () => {
        if (!supabase) { setLoading(false); return; }
        const [services, articles, comments] = await Promise.allSettled([
            supabase.from('service_providers').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('comments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        ]);
        const n = (r: PromiseSettledResult<{ count: number | null; error: unknown }>) =>
            r.status === 'fulfilled' && !r.value.error ? (r.value.count || 0) : 0;
        setCounts({ services: n(services), articles: n(articles), comments: n(comments) });
        setLoading(false);
    }, []);

    useEffect(() => { fetchCounts(); }, [fetchCounts]);

    // Realtime: a newly-submitted comment bumps the pending count live so the
    // admin sees moderation work arrive without a refresh. Unique channel name
    // per mount avoids duplicate-event collisions across navigations.
    useEffect(() => {
        if (!supabase) return;
        const channelName = `action-center-${Math.random().toString(36).slice(2, 10)}`;
        const channel = supabase
            .channel(channelName)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, () => {
                setCounts((prev) => ({ ...prev, comments: prev.comments + 1 }));
            })
            .subscribe();
        return () => { supabase?.removeChannel(channel); };
    }, []);

    async function handleBatch(action: 'approve' | 'reject') {
        setBatchLoading(action);
        try {
            const res = await fetch('/api/admin/batch-comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(data.message);
                setCounts((prev) => ({ ...prev, comments: 0 }));
            } else {
                toast.error(data.error || 'فشلت العملية');
            }
        } catch {
            toast.error('خطأ في الاتصال');
        } finally {
            setBatchLoading(null);
        }
    }

    const total = counts.services + counts.articles + counts.comments;

    if (loading) {
        return <div className="animate-pulse h-16 bg-slate-100 dark:bg-slate-800/60 rounded-2xl w-full" />;
    }

    // All queues empty → one slim reassuring row, not a tall banner.
    if (total === 0) {
        return (
            <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 px-4 py-3">
                <CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                    <p className="text-sm font-black text-emerald-800 dark:text-emerald-300">كل شيء هادئ</p>
                    <p className="text-[11px] text-emerald-700/70 dark:text-emerald-400/60 font-medium">لا مهام معلّقة تحتاج انتباهك</p>
                </div>
            </div>
        );
    }

    const cards = [
        counts.services > 0 && {
            key: 'services', href: '/admin/requests', icon: Briefcase, count: counts.services,
            label: 'طلب/خدمة بانتظار الموافقة', border: 'border-r-blue-500',
            iconCls: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
        },
        counts.articles > 0 && {
            key: 'articles', href: '/admin/articles', icon: FileText, count: counts.articles,
            label: 'مقال بانتظار المراجعة', border: 'border-r-emerald-500',
            iconCls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
        },
        counts.comments > 0 && {
            key: 'comments', href: '/admin/community', icon: MessageCircle, count: counts.comments,
            label: 'تعليق بانتظار الموافقة', border: 'border-r-indigo-500',
            iconCls: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
        },
    ].filter(Boolean) as {
        key: string; href: string; icon: typeof Briefcase; count: number;
        label: string; border: string; iconCls: string;
    }[];

    return (
        <div className="space-y-2.5">
            <div className="flex items-center gap-1.5">
                <span className="relative inline-flex items-center justify-center w-1.5 h-1.5">
                    <span className="absolute inline-flex w-1.5 h-1.5 rounded-full bg-red-500 opacity-75 animate-ping" />
                    <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-red-500" />
                </span>
                <h2 className="text-[11px] font-black tracking-[0.2em] uppercase text-red-600 dark:text-red-400">مهام معلّقة</h2>
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black tabular-nums shadow-sm shadow-red-500/30">{total}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {cards.map((c) => {
                    const Icon = c.icon;
                    return (
                        <div key={c.key} className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-r-4 ${c.border} rounded-xl overflow-hidden`}>
                            <Link href={c.href} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${c.iconCls}`}>
                                    <Icon size={18} />
                                </span>
                                <div className="min-w-0">
                                    <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums leading-none">{c.count}</div>
                                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{c.label}</div>
                                </div>
                            </Link>

                            {/* Comments get inline batch controls — clear the whole queue in one tap. */}
                            {c.key === 'comments' && (
                                <div className="flex gap-1.5 px-3 pb-3">
                                    <button
                                        type="button"
                                        onClick={() => handleBatch('approve')}
                                        disabled={batchLoading !== null}
                                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/30 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {batchLoading === 'approve' ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                                        قبول الكل
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleBatch('reject')}
                                        disabled={batchLoading !== null}
                                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-[11px] font-bold hover:bg-red-100 dark:hover:bg-red-900/30 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {batchLoading === 'reject' ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                                        رفض الكل
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
