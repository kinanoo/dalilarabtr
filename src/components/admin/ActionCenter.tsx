'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { BellRing, MessageCircle, FileWarning, CheckCircle, X } from 'lucide-react';
import Link from 'next/link';

const DISMISS_KEY = 'action_center_dismissed';

function getDismissed(): Record<string, number> {
    try { return JSON.parse(localStorage.getItem(DISMISS_KEY) || '{}'); } catch { return {}; }
}

function saveDismissed(d: Record<string, number>) {
    localStorage.setItem(DISMISS_KEY, JSON.stringify(d));
}

export function ActionCenter() {
    const [counts, setCounts] = useState({
        pendingComments: 0,
        negativeFeedback: 0,
        totalIssues: 0
    });
    const [loading, setLoading] = useState(true);
    // dismissed: maps card key → count at time of dismissal. Card re-appears if count increases.
    const [dismissed, setDismissed] = useState<Record<string, number>>({});

    useEffect(() => {
        setDismissed(getDismissed());
    }, []);

    useEffect(() => {
        const fetchCounts = async () => {
            if (!supabase) return;

            const [comments, feedback] = await Promise.all([
                supabase.from('comments').select('id', { count: 'exact' }).eq('status', 'pending'),
                supabase.from('content_votes').select('id', { count: 'exact' }).eq('vote_type', 'down'),
            ]);

            const cCount = comments.count || 0;
            const fCount = feedback.count || 0;

            setCounts({
                pendingComments: cCount,
                negativeFeedback: fCount,
                totalIssues: cCount + fCount
            });
            setLoading(false);
        };
        fetchCounts();
    }, []);

    const dismiss = (key: string, count: number) => {
        const next = { ...dismissed, [key]: count };
        setDismissed(next);
        saveDismissed(next);
    };

    // A card is visible if not dismissed, or if count grew since last dismissal
    const isVisible = (key: string, count: number) =>
        count > 0 && (dismissed[key] === undefined || count > dismissed[key]);

    const showFeedback = isVisible('negativeFeedback', counts.negativeFeedback);
    const showComments = isVisible('pendingComments', counts.pendingComments);
    const visibleCount = (showFeedback ? counts.negativeFeedback : 0) + (showComments ? counts.pendingComments : 0);

    if (loading) return <div className="animate-pulse h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full"></div>;

    if (visibleCount === 0) {
        return (
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden">
                <div className="relative z-10 flex items-center gap-6">
                    <div className="p-4 bg-white/20 backdrop-blur-sm rounded-full">
                        <CheckCircle size={40} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black mb-1">كل شيء هادئ!</h2>
                        <p className="opacity-90 font-medium">لا توجد مهام معلقة تتطلب انتباهك حالياً.</p>
                    </div>
                </div>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <BellRing className="text-red-500" />
                مركز الإشعارات والمهام
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{visibleCount}</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {showFeedback && (
                    <div className="relative group/card">
                        <Link href="/admin/reviews" className="bg-white dark:bg-slate-900 border-l-4 border-l-amber-500 p-4 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-4 group">
                            <div className="p-3 bg-amber-100 text-amber-600 rounded-lg group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                <FileWarning size={24} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-800 dark:text-white">{counts.negativeFeedback}</div>
                                <div className="text-xs font-bold text-slate-500">ملاحظات سلبية تحتاج مراجعة</div>
                            </div>
                        </Link>
                        <button
                            onClick={() => dismiss('negativeFeedback', counts.negativeFeedback)}
                            title="تجاهل"
                            className="absolute top-2 left-2 p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 opacity-0 group-hover/card:opacity-100 transition-all"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}

                {showComments && (
                    <div className="relative group/card">
                        <Link href="/admin/community" className="bg-white dark:bg-slate-900 border-l-4 border-l-indigo-500 p-4 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-4 group">
                            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                <MessageCircle size={24} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-800 dark:text-white">{counts.pendingComments}</div>
                                <div className="text-xs font-bold text-slate-500">تعليقات جديدة بانتظار الموافقة</div>
                            </div>
                        </Link>
                        <button
                            onClick={() => dismiss('pendingComments', counts.pendingComments)}
                            title="تجاهل"
                            className="absolute top-2 left-2 p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 opacity-0 group-hover/card:opacity-100 transition-all"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
