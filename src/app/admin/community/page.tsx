'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { MessageSquare, AlertTriangle, CheckCircle2, Trash2, ArrowRight, Loader2, MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { createNotification } from '@/lib/api/notifications';
import Link from 'next/link';

export default function AdminCommunityPage() {
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [converting, setConverting] = useState<string | null>(null);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');

    useEffect(() => {
        fetchComments();
    }, []);

    const fetchComments = async () => {
        if (!supabase) return;
        // Fetch all comments, then separate parents from replies in JS
        const { data } = await supabase
            .from('comments')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) {
            const parents = data.filter(c => !c.parent_id);
            const replies = data.filter(c => c.parent_id);
            // Attach replies to their parent
            const enriched = parents.map(p => ({
                ...p,
                replies: replies
                    .filter(r => r.parent_id === p.id)
                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
            }));
            setComments(enriched);
        }
        setLoading(false);
    };

    const handleApprove = async (id: string) => {
        if (!confirm('هل تريد نشر هذا التعليق؟')) return;
        if (!supabase) return;
        const { error } = await supabase.from('comments').update({ status: 'approved' }).eq('id', id);
        if (error) {
            toast.error('فشل النشر: ' + error.message);
        } else {
            toast.success('تم النشر');
            fetchComments();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('حذف هذا التعليق؟')) return;
        if (!supabase) return;
        const { error } = await supabase.from('comments').delete().eq('id', id);
        if (error) {
            toast.error('فشل الحذف: ' + error.message);
        } else {
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

    const handleReply = async (comment: any) => {
        if (!supabase || !replyContent.trim()) return;
        const entityId = comment.entity_id || comment.page_slug || '';
        const { error } = await supabase.from('comments').insert({
            parent_id: comment.id,
            entity_type: comment.entity_type,
            entity_id: entityId,
            page_slug: entityId,
            author_name: 'الإدارة',
            content: replyContent.trim(),
            status: 'approved',
            is_official: true,
        });
        if (error) {
            toast.error('فشل إرسال الرد: ' + error.message);
        } else {
            toast.success('تم إرسال الرد');
            // Notify the commenter if they have a user_id
            if (comment.user_id) {
                const link =
                    comment.entity_type === 'article'  ? `/article/${comment.entity_id}` :
                    comment.entity_type === 'service'  ? `/services/${comment.entity_id}` :
                    comment.entity_type === 'update'   ? `/updates/${comment.entity_id}` :
                    comment.entity_type === 'scenario' && comment.entity_id?.startsWith('code-') ? `/codes/${comment.entity_id.replace('code-', '')}` :
                    comment.entity_type === 'scenario' ? `/consultant?scenario=${comment.entity_id}` :
                    comment.entity_type === 'zone'     ? `/zones/${comment.entity_id}` :
                    undefined;
                createNotification({
                    type: 'reply',
                    title: 'ردّ من الإدارة على تعليقك',
                    message: `ردّت إدارة الموقع: "${replyContent.trim().substring(0, 80)}${replyContent.trim().length > 80 ? '...' : ''}"`,
                    link,
                    icon: '💬',
                    priority: 'high',
                    target_user_id: comment.user_id,
                });
            }
            setReplyContent('');
            setReplyingTo(null);
            fetchComments();
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">جاري التحميل...</div>;

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

            {comments.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                    <MessageSquare size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="font-bold">لا توجد تعليقات حتى الآن</p>
                </div>
            ) : (
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
                                    <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full whitespace-nowrap">{
                                        ({ article: 'مقال', service: 'خدمة', update: 'تحديث', scenario: 'سيناريو', zone: 'منطقة', faq: 'سؤال شائع' } as Record<string, string>)[c.entity_type] || c.entity_type
                                    }</span>
                                </div>
                                <span className="text-[10px] sm:text-xs text-slate-400">{new Date(c.created_at).toLocaleDateString('ar-EG')}</span>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0 bg-white dark:bg-slate-950 p-1 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
                                {c.status === 'pending' && (
                                    <button onClick={() => handleApprove(c.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="موافقة" aria-label="موافقة">
                                        <CheckCircle2 size={18} />
                                    </button>
                                )}
                                <button onClick={() => handleDelete(c.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="حذف" aria-label="حذف">
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
                                    c.entity_type === 'article'  ? `/article/${c.entity_id}` :
                                    c.entity_type === 'update'   ? `/updates/${c.entity_id}` :
                                    c.entity_type === 'service'  ? `/services/${c.entity_id}` :
                                    c.entity_type === 'scenario' && c.entity_id?.startsWith('code-') ? `/codes/${c.entity_id.replace('code-', '')}` :
                                    c.entity_type === 'scenario' ? `/consultant?scenario=${c.entity_id}` :
                                    c.entity_type === 'zone'     ? `/zones/${c.entity_id}` :
                                    c.entity_type === 'faq'      ? '/faq' :
                                    '#'
                                }
                                className="flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 rounded-xl transition hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                            >
                                عرض المحتوى الأصلي
                            </Link>
                        </div>

                        {/* Admin replies */}
                        <div className="mt-4 space-y-3">
                            {c.replies?.map((reply: any) => (
                                <div key={reply.id} className="bg-emerald-50 dark:bg-emerald-900/10 p-3 sm:p-4 rounded-xl flex gap-3 border border-emerald-100 dark:border-emerald-800 mr-4 sm:mr-8">
                                    <MessageCircle size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-emerald-800 dark:text-emerald-400 text-sm">{reply.author_name}</span>
                                            <span className="text-[10px] text-emerald-600/60">{new Date(reply.created_at).toLocaleDateString('ar-EG')}</span>
                                        </div>
                                        <p className="text-emerald-700 dark:text-emerald-300 text-sm leading-relaxed">{reply.content}</p>
                                    </div>
                                </div>
                            ))}

                            {replyingTo === c.id ? (
                                <div className="flex gap-2 mr-4 sm:mr-8">
                                    <input
                                        className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        value={replyContent}
                                        onChange={e => setReplyContent(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(c); } }}
                                        placeholder="اكتب رد الإدارة..."
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => handleReply(c)}
                                        disabled={!replyContent.trim()}
                                        className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-1.5"
                                    >
                                        <Send size={14} /> إرسال
                                    </button>
                                    <button
                                        onClick={() => { setReplyingTo(null); setReplyContent(''); }}
                                        className="px-3 py-2 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => { setReplyingTo(c.id); setReplyContent(''); }}
                                    className="text-emerald-600 font-bold text-xs flex items-center gap-1.5 hover:underline mr-4 sm:mr-8"
                                >
                                    <MessageCircle size={14} /> رد على التعليق
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            )}
        </div>
    );
}
