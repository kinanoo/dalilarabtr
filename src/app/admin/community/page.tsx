'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { MessageSquare, AlertTriangle, CheckCircle2, Trash2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminCommunityPage() {
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

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

    const convertToUpdate = (comment: any) => {
        // Redirect to updates page with pre-filled data (concept)
        // Since we don't have a "Create Update" page with query params yet, we'll just copy to clipboard or Mock it.
        // Ideally: router.push(`/admin/updates?new=true&title=تصحيح من ${comment.author_name}&content=${comment.content}`);
        // For now, let's copy to clipboard and notify.
        navigator.clipboard.writeText(`تصحيح من ${comment.author_name}:\n${comment.content}`);
        toast.message('تم نسخ المحتوى!', {
            description: 'اذهب لصفحة "التحديثات" وأضف خبراً جديداً بالمعلومات المنسوخة.'
        });
        router.push('/admin/updates');
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                    <MessageSquare size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">إدارة المجتمع</h1>
                    <p className="text-slate-500 mt-1">التعليقات، التصحيحات، والمشاركات</p>
                </div>
            </div>

            <div className="grid gap-4">
                {comments.map((c) => (
                    <div key={c.id} className={`p-6 rounded-2xl border ${c.is_correction ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/10' : 'bg-white dark:bg-slate-900 border-slate-200'} shadow-sm relative overflow-hidden`}>
                        {c.is_correction && (
                            <div className="absolute top-0 left-0 bg-amber-500 text-white text-[10px] px-2 py-1 rounded-br-lg font-bold flex items-center gap-1">
                                <AlertTriangle size={10} /> تصحيح
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white">{c.author_name}</span>
                                <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{c.entity_type}</span>
                                <span className="text-xs text-slate-400">{new Date(c.created_at).toLocaleDateString('ar-EG')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {c.status === 'pending' && (
                                    <button onClick={() => handleApprove(c.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="موافقة">
                                        <CheckCircle2 size={18} />
                                    </button>
                                )}
                                <button onClick={() => handleDelete(c.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="حذف">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <p className="text-slate-700 dark:text-slate-300 bg-white/50 dark:bg-black/20 p-3 rounded-lg border border-indigo-50/50 mb-4 text-sm leading-relaxed">
                            {c.content}
                        </p>

                        <div className="flex items-center justify-end gap-3">
                            {c.is_correction && (
                                <button
                                    onClick={() => convertToUpdate(c)}
                                    className="flex items-center gap-2 text-xs font-bold bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition"
                                >
                                    <ArrowRight size={14} />
                                    تحويل لخبر عاجل
                                </button>
                            )}
                            <Link href={`/${c.entity_type === 'article' ? 'article/' : c.entity_type === 'update' ? 'updates#upd-' : ''}${c.entity_id}`} className="text-xs text-indigo-500 hover:underline">
                                عرض المحتوى الأصلي
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
