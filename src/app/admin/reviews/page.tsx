'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Star, Trash2, MessageCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        if (!supabase) return;
        const { data, error } = await supabase
            .from('service_reviews')
            .select(`
                *,
                review_replies (*)
            `)
            .order('created_at', { ascending: false });

        if (data) setReviews(data);
        if (error) toast.error('Error loading reviews: ' + error.message);
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا التقييم؟')) return;
        if (!supabase) return;

        const { error } = await supabase.from('service_reviews').delete().eq('id', id);
        if (!error) {
            toast.success('تم الحذف بنجاح');
            fetchReviews();
        } else {
            toast.error('خطأ في الحذف: ' + error.message);
        }
    };

    const handleReply = async (reviewId: string) => {
        if (!replyContent.trim()) return;
        if (!supabase) return;

        const { error } = await supabase.from('review_replies').insert([{
            review_id: reviewId,
            author_name: 'الإدارة',
            content: replyContent,
            is_official: true
        }]);

        if (!error) {
            toast.success('تم الرد بنجاح');
            setReplyContent('');
            setReplyingTo(null);
            fetchReviews();
        } else {
            toast.error('خطأ في الرد: ' + error.message);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">جاري التحميل...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                    <Star size={32} fill="currentColor" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">إدارة التقييمات</h1>
                    <p className="text-slate-500 mt-1">مراقبة التعليقات والرد على العملاء</p>
                </div>
            </div>

            <div className="grid gap-6">
                {reviews.map((review) => (
                    <div key={review.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg mb-1">{review.client_name}</h3>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <div className="flex text-amber-400">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "text-amber-400" : "text-slate-200"} />
                                        ))}
                                    </div>
                                    <span>• {review.service_name || 'خدمة غير معروفة'} •</span>
                                    <span>{new Date(review.created_at).toLocaleDateString('ar-EG')}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(review.id)}
                                className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <p className="text-slate-700 dark:text-slate-300 mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                            "{review.comment}"
                        </p>

                        {/* Replies */}
                        <div className="space-y-4">
                            {review.review_replies?.map((reply: any) => (
                                <div key={reply.id} className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 p-4 rounded-xl flex gap-3">
                                    <MessageCircle size={18} className="text-emerald-600 shrink-0 mt-1" />
                                    <div>
                                        <div className="font-bold text-emerald-800 dark:text-emerald-400 text-sm mb-1">{reply.author_name}</div>
                                        <p className="text-emerald-700 dark:text-emerald-300 text-sm">{reply.content}</p>
                                    </div>
                                </div>
                            ))}

                            {replyingTo === review.id ? (
                                <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
                                    <input
                                        className="flex-1 border border-emerald-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-slate-800"
                                        placeholder="اكتب ردك هنا..."
                                        value={replyContent}
                                        onChange={e => setReplyContent(e.target.value)}
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => handleReply(review.id)}
                                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700"
                                    >
                                        إرسال
                                    </button>
                                    <button
                                        onClick={() => setReplyingTo(null)}
                                        className="text-slate-500 px-4 py-2 font-bold hover:bg-slate-100 rounded-lg"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setReplyingTo(review.id)}
                                    className="text-emerald-600 font-bold text-sm hover:underline flex items-center gap-2"
                                >
                                    <MessageCircle size={16} /> رد على التقييم
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {reviews.length === 0 && (
                    <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300">
                        <p className="text-slate-500 font-bold">لا توجد تقييمات حتى الآن</p>
                    </div>
                )}
            </div>
        </div>
    );
}
