'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Star, Trash2, MessageCircle, AlertTriangle, CheckCircle2, FileWarning, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AdminReviewsPage() {
    const [activeTab, setActiveTab] = useState<'reviews' | 'feedback'>('reviews');
    const [reviews, setReviews] = useState<any[]>([]);
    const [feedbackitems, setFeedbackItems] = useState<any[]>([]); // Items from content_votes
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        if (!supabase) return;
        setLoading(true);

        // 1. Fetch Reviews
        const { data: reviewsData } = await supabase
            .from('service_reviews')
            .select(`*, review_replies (*)`)
            .order('created_at', { ascending: false });

        if (reviewsData) setReviews(reviewsData);

        // 2. Fetch Feedback (Negative Votes with content)
        const { data: feedbackData } = await supabase
            .from('content_votes')
            .select('*')
            .eq('vote_type', 'down')
            .or('feedback.neq.null,reason.neq.null') // Only those with feedback
            .order('created_at', { ascending: false });

        if (feedbackData) setFeedbackItems(feedbackData);

        setLoading(false);
    };

    // --- Reviews Handlers ---
    const handleDeleteReview = async (id: string) => {
        if (!confirm('حذف هذا التقييم؟')) return;
        const { error } = await supabase!.from('service_reviews').delete().eq('id', id);
        if (!error) {
            toast.success('تم الحذف');
            fetchData();
        } else {
            toast.error(error.message);
        }
    };

    const handleReply = async (reviewId: string) => {
        if (!replyContent.trim()) return;
        const { error } = await supabase!.from('review_replies').insert([{
            review_id: reviewId, author_name: 'الإدارة', content: replyContent, is_official: true
        }]);
        if (!error) {
            toast.success('تم الرد');
            setReplyContent('');
            setReplyingTo(null);
            fetchData();
        }
    };

    // --- Feedback Handlers ---
    const handleDeleteFeedback = async (id: string) => {
        if (!confirm('حذف هذه الملاحظة؟')) return;
        const { error } = await supabase!.from('content_votes').delete().eq('id', id);
        if (!error) {
            toast.success('تم الحذف');
            fetchData();
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">جاري التحميل...</div>;

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                    <Star size={32} fill="currentColor" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">إدارة التفاعل</h1>
                    <p className="text-slate-500 mt-1">التقييمات والملاحظات من الزوار</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 mb-6">
                <button
                    onClick={() => setActiveTab('reviews')}
                    className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'reviews'
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Star size={16} />
                    التقييمات ({reviews.length})
                </button>
                <button
                    onClick={() => setActiveTab('feedback')}
                    className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'feedback'
                        ? 'border-amber-500 text-amber-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <FileWarning size={16} />
                    الملاحظات ({feedbackitems.length})
                </button>
            </div>

            {/* REVIEWS TAB */}
            {activeTab === 'reviews' && (
                <div className="grid gap-6">
                    {reviews.length === 0 ? (
                        <div className="text-center py-20 text-slate-500">لا توجد تقييمات</div>
                    ) : (
                        reviews.map((review) => (
                            <div key={review.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg mb-1">{review.client_name}</h3>
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <div className="flex text-amber-400">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "text-amber-400" : "text-slate-200"} />
                                                ))}
                                            </div>
                                            <span>• {review.service_name || 'خدمة'} •</span>
                                            <span>{new Date(review.created_at).toLocaleDateString('ar-EG')}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteReview(review.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                                <p className="text-slate-700 dark:text-slate-300 mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">"{review.comment}"</p>

                                {/* Replies */}
                                <div className="space-y-4">
                                    {review.review_replies?.map((reply: any) => (
                                        <div key={reply.id} className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl flex gap-3 border border-emerald-100 dark:border-emerald-800">
                                            <MessageCircle size={18} className="text-emerald-600 shrink-0 mt-1" />
                                            <div>
                                                <div className="font-bold text-emerald-800 dark:text-emerald-400 text-sm">{reply.author_name}</div>
                                                <p className="text-emerald-700 dark:text-emerald-300 text-sm">{reply.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {replyingTo === review.id ? (
                                        <div className="flex gap-2">
                                            <input className="flex-1 border p-2 rounded-lg dark:bg-slate-800" value={replyContent} onChange={e => setReplyContent(e.target.value)} placeholder="اكتب الرد..." autoFocus />
                                            <button onClick={() => handleReply(review.id)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold">إرسال</button>
                                            <button onClick={() => setReplyingTo(null)} className="px-4 py-2 font-bold text-slate-500">إلغاء</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setReplyingTo(review.id)} className="text-emerald-600 font-bold text-sm flex items-center gap-2 hover:underline">
                                            <MessageCircle size={16} /> رد على التقييم
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* FEEDBACK TAB */}
            {activeTab === 'feedback' && (
                <div className="grid gap-4">
                    {feedbackitems.length === 0 ? (
                        <div className="text-center py-20 text-slate-500">لا توجد ملاحظات سلبية</div>
                    ) : (
                        feedbackitems.map((item) => (
                            <div key={item.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-l-4 border-l-amber-500 border-slate-200 dark:border-slate-800">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                                            <AlertTriangle size={14} />
                                            {item.reason || 'بدون سبب محدد'}
                                        </span>
                                        <span className="text-sm font-bold text-slate-500 uppercase">{item.entity_type}</span>
                                    </div>
                                    <button onClick={() => handleDeleteFeedback(item.id)} className="text-slate-400 hover:text-red-500 p-1">
                                        <CheckCircle2 size={20} title="تمت المعالجة (حذف)" />
                                    </button>
                                </div>

                                <p className="text-slate-800 dark:text-slate-200 font-medium text-lg mb-4 leading-relaxed">
                                    {item.feedback ? `"${item.feedback}"` : <span className="text-slate-400 italic">بدون تعليق نصي</span>}
                                </p>

                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                                    <div className="flex items-center gap-4">
                                        <span>{new Date(item.created_at).toLocaleDateString('ar-EG')}</span>
                                        {/* Link to Entity */}
                                        <Link
                                            href={`/${item.entity_type === 'article' ? 'article' : item.entity_type === 'service' ? 'services' : ''}/${item.entity_id}`}
                                            target="_blank"
                                            className="flex items-center gap-1 hover:text-emerald-600 text-slate-500 transition-colors"
                                        >
                                            <ExternalLink size={12} /> عرض المحتوى
                                        </Link>
                                    </div>
                                    <span className="font-mono opacity-50">{item.id.slice(0, 8)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
