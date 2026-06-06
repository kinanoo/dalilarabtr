'use client';

/**
 * /admin/questions — admin Q&A review queue.
 *
 * Shows ALL questions (pending, answered, rejected, spam) with status
 * filters. Pending questions get an inline answer box so the admin can
 * reply + publish in one action. Status changes use the admin client
 * (RLS `questions_admin_all` policy authorises everything via is_admin()).
 */

import { useEffect, useMemo, useState } from 'react';
import {
    HelpCircle,
    CheckCircle2,
    XCircle,
    Trash2,
    Filter,
    Loader2,
    Send,
    Star,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

type Status = 'pending' | 'answered' | 'rejected' | 'spam';

interface Question {
    id: string;
    question: string;
    context: string | null;
    category: string | null;
    asker_name: string | null;
    asker_email: string | null;
    status: Status;
    answer: string | null;
    answered_at: string | null;
    upvotes: number;
    views: number;
    is_featured: boolean;
    created_at: string;
}

const STATUS_LABELS: Record<Status | 'all', string> = {
    all: 'الكلّ',
    pending: 'بانتظار الردّ',
    answered: 'مُجاب',
    rejected: 'مرفوض',
    spam: 'سبام',
};

export default function AdminQuestionsPage() {
    const [filter, setFilter] = useState<Status | 'all'>('pending');
    const [items, setItems] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [draftAnswers, setDraftAnswers] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState<string | null>(null);

    async function load() {
        if (!supabase) return;
        setLoading(true);
        let q = supabase
            .from('questions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);
        if (filter !== 'all') q = q.eq('status', filter);
        const { data } = await q;
        setItems((data as Question[]) || []);
        setLoading(false);
    }

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    const counts = useMemo(() => {
        const result: Record<string, number> = { all: items.length };
        for (const it of items) result[it.status] = (result[it.status] || 0) + 1;
        return result;
    }, [items]);

    async function answer(id: string) {
        if (!supabase) return;
        const text = (draftAnswers[id] || '').trim();
        if (text.length < 5) {
            alert('الإجابة قصيرة جداً.');
            return;
        }
        setBusy(id);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase
                .from('questions')
                .update({
                    answer: text,
                    status: 'answered',
                    answered_by: user?.id || null,
                    answered_at: new Date().toISOString(),
                })
                .eq('id', id);
            if (error) {
                alert('فشل النشر: ' + error.message);
            } else {
                setDraftAnswers((d) => {
                    const next = { ...d };
                    delete next[id];
                    return next;
                });
                await load();
            }
        } finally {
            setBusy(null);
        }
    }

    async function changeStatus(id: string, status: Status) {
        if (!supabase) return;
        setBusy(id);
        try {
            await supabase.from('questions').update({ status }).eq('id', id);
            await load();
        } finally {
            setBusy(null);
        }
    }

    async function toggleFeatured(id: string, current: boolean) {
        if (!supabase) return;
        setBusy(id);
        try {
            await supabase.from('questions').update({ is_featured: !current }).eq('id', id);
            await load();
        } finally {
            setBusy(null);
        }
    }

    async function remove(id: string) {
        if (!supabase) return;
        if (!confirm('حذف السؤال نهائياً؟ لا يمكن التراجع.')) return;
        setBusy(id);
        try {
            await supabase.from('questions').delete().eq('id', id);
            await load();
        } finally {
            setBusy(null);
        }
    }

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6">
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-50 flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                        <HelpCircle size={22} />
                    </span>
                    إدارة الأسئلة
                </h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    راجع الأسئلة الواردة، اكتب الإجابة وانشرها، أو ارفض/احذف السبام.
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
                <Filter size={16} className="text-slate-400" />
                {(['pending', 'answered', 'rejected', 'spam', 'all'] as const).map((f) => {
                    const isActive = filter === f;
                    return (
                        <button
                            key={f}
                            type="button"
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                                isActive
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            {STATUS_LABELS[f]}{' '}
                            {counts[f] !== undefined && (
                                <span className="opacity-70">({counts[f]})</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center py-16 text-slate-400">
                    <Loader2 size={28} className="animate-spin" />
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800">
                    <HelpCircle size={36} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-slate-500 dark:text-slate-400">
                        لا أسئلة في هذا التصنيف.
                    </p>
                </div>
            ) : (
                <ul className="space-y-3">
                    {items.map((q) => (
                        <li
                            key={q.id}
                            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5"
                        >
                            <div className="flex items-start gap-3">
                                <span
                                    className={`shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-xl text-xs font-black ${
                                        q.status === 'answered'
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                            : q.status === 'pending'
                                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                    }`}
                                >
                                    س
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                                        {q.question}
                                    </p>
                                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold">
                                            {STATUS_LABELS[q.status]}
                                        </span>
                                        {q.category && (
                                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                                                {q.category}
                                            </span>
                                        )}
                                        {q.asker_name && <span>👤 {q.asker_name}</span>}
                                        <span>{new Date(q.created_at).toLocaleDateString('ar-EG')}</span>
                                        {q.views > 0 && <span>👁 {q.views}</span>}
                                    </div>
                                    {q.context && (
                                        <p className="mt-2 text-xs text-slate-500 italic">
                                            <strong>سياق:</strong> {q.context}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => toggleFeatured(q.id, q.is_featured)}
                                        disabled={busy === q.id}
                                        className={`p-1.5 rounded-lg transition-colors ${
                                            q.is_featured
                                                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-amber-600'
                                        }`}
                                        title="تمييز"
                                    >
                                        <Star size={14} fill={q.is_featured ? 'currentColor' : 'none'} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => remove(q.id)}
                                        disabled={busy === q.id}
                                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-600"
                                        title="حذف"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Existing answer (if any) */}
                            {q.answer && (
                                <div className="mt-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-3">
                                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-1">
                                        الإجابة المنشورة:
                                    </p>
                                    <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                                        {q.answer}
                                    </p>
                                </div>
                            )}

                            {/* Inline answer box for pending */}
                            {q.status === 'pending' && (
                                <div className="mt-3 space-y-2">
                                    <textarea
                                        value={draftAnswers[q.id] || ''}
                                        onChange={(e) =>
                                            setDraftAnswers((d) => ({ ...d, [q.id]: e.target.value }))
                                        }
                                        rows={3}
                                        placeholder="اكتب إجابتك هنا… اذكر المصدر الرسمي إن أمكن."
                                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                                    />
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => answer(q.id)}
                                            disabled={busy === q.id || !(draftAnswers[q.id] || '').trim()}
                                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs disabled:opacity-50"
                                        >
                                            {busy === q.id ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <Send size={14} />
                                            )}
                                            نشر الإجابة
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => changeStatus(q.id, 'rejected')}
                                            disabled={busy === q.id}
                                            className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-1.5 px-3 rounded-lg text-xs"
                                        >
                                            <XCircle size={14} /> رفض
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => changeStatus(q.id, 'spam')}
                                            disabled={busy === q.id}
                                            className="flex items-center gap-1.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300 font-bold py-1.5 px-3 rounded-lg text-xs"
                                        >
                                            🚫 سبام
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Quick re-status for already-handled questions */}
                            {q.status !== 'pending' && q.status !== 'answered' && (
                                <button
                                    type="button"
                                    onClick={() => changeStatus(q.id, 'pending')}
                                    className="mt-2 text-xs text-slate-500 hover:text-emerald-600 font-bold"
                                >
                                    ← إرجاع لقائمة الانتظار
                                </button>
                            )}
                            {q.status === 'answered' && (
                                <p className="mt-2 text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 size={12} /> منشور للجمهور
                                </p>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
