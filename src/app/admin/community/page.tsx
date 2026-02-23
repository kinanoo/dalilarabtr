'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { MessageSquare, AlertTriangle, CheckCircle2, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AdminCommunityPage() {
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [converting, setConverting] = useState<string | null>(null);

    useEffect(() => {
        fetchComments();
    }, []);

    const fetchComments = async () => {
        if (!supabase) return;
        const { data, error } = await supabase
            .from('comments')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setComments(data);
        setLoading(false);
    };

    const handleApprove = async (id: string) => {
        if (!supabase) return;
        const { error } = await supabase.from('comments').update({ status: 'approved' }).eq('id', id);
        if (!error) {
            toast.success('تم النشر');
            fetchComments();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('حذف هذا التعليق؟')) return;
        if (!supabase) return;
        const { error } = await supabase.from('comments').delete().eq('id', id);
        if (!error) {
            toast.success('تم الحذف');
            fetchComments();
        }
    };

    const convertToUpdate = async (comment: any) => {
        if (!supabase) return;
        setConverting(comment.id);
        try {
            const { error } = await supabase.from('updates').insert({
                title: `تصحيح: ${comment.author_name}`,
                content: comment.content,
                type: 'news',
                date: new Date().toISOString().split('T')[0],
                active: true,
            });
            if (error) throw error;
            // Auto-approve the source comment (best-effort — non-critical if fails)
            const { error: approveError } = await supabase.from('comments').update({ status: 'approved' }).eq('id', comment.id);
            if (approveError) console.warn('Auto-approve comment failed:', approveError.message);
            toast.success('✅ تم إنشاء التحديث ونشره مباشرة');
            fetchComments();
        } catch (err: any) {
            toast.error('خطأ: ' + err.message);
        } finally {
            setConverting(null);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 pb-20 sm:pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                        <MessageSquare size={28} className="sm:w-8 sm:h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">إدارة المجتمع</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base mt-1">التعليقات والمشاركات</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {comments.map((c) => (
                    <div key={c.id} className={`p-4 sm:p-6 rounded-2xl border ${c.is_correction ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/10' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'} shadow-sm relative overflow-hidden`}>
                        {c.is_correction && (
                            <div className="absolute top-0 right-0 sm:left-0 sm:right-auto bg-amber-500 text-white text-[10px] px-3 py-1 rounded-bl-xl sm:rounded-br-xl sm:rounded-bl-none font-bold flex items-center gap-1 z-10">
                                <AlertTriangle size={12} /> تصحيح
                            </div>
                        )}

                        <div className="flex justify-between items-start gap-3 mb-3 mt-4 sm:mt-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 w-full">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">{c.author_name}</span>
                                    <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full whitespace-nowrap">{c.entity_type}</span>
                                </div>
                                <span className="text-[10px] sm:text-xs text-slate-400">{new Date(c.created_at).toLocaleDateString('ar-EG')}</span>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0 bg-white dark:bg-slate-950 p-1 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
                                {c.status === 'pending' && (
                                    <button onClick={() => handleApprove(c.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="موافقة">
                                        <CheckCircle2 size={18} />
                                    </button>
                                )}
                                <button onClick={() => handleDelete(c.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="حذف">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-black/20 p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-800 mb-4 text-sm leading-relaxed whitespace-pre-wrap">
                            {c.content}
                        </p>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                            {c.is_correction && (
                                <button
                                    onClick={() => convertToUpdate(c)}
                                    disabled={converting === c.id}
                                    className="flex items-center justify-center gap-2 text-xs font-bold bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition shadow-sm active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {converting === c.id
                                        ? <><Loader2 size={14} className="animate-spin" /> جاري النشر...</>
                                        : <><ArrowRight size={14} /> تحويل لخبر عاجل</>
                                    }
                                </button>
                            )}
                            <Link
                                href={
                                    c.entity_type === 'article' ? `/article/${c.entity_id}` :
                                    c.entity_type === 'update'  ? `/updates#upd-${c.entity_id}` :
                                    c.entity_type === 'service' ? `/services/${c.entity_id}` :
                                    c.entity_type === 'faq'     ? '/faq' :
                                    `/${c.entity_id}`
                                }
                                className="flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 rounded-xl transition hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                            >
                                عرض المحتوى الأصلي
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
