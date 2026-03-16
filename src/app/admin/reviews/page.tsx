'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Star, Trash2, MessageCircle, AlertTriangle, FileWarning, ExternalLink, CheckCircle2, ArrowRight, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { createNotification } from '@/lib/api/notifications';
import Link from 'next/link';

interface ReviewReply {
    id: string;
    review_id: string;
    author_name: string;
    content: string;
    is_official?: boolean;
    created_at: string;
}

interface Review {
    id: string;
    client_name: string;
    rating: number;
    comment: string;
    service_id: string;
    service_name?: string;
    user_id?: string;
    created_at: string;
    review_replies?: ReviewReply[];
}

interface FeedbackItem {
    id: string;
    entity_type: string;
    entity_id: string;
    vote_type: string;
    reason?: string;
    feedback?: string;
    created_at: string;
    entity_title?: string | null;
}

interface EntityRecord {
    id: string;
    title?: string;
    name?: string;
}

export default function AdminReviewsPage() {

    const [activeTab, setActiveTab] = useState<'reviews' | 'feedback'>('feedback');
    const [reviews, setReviews] = useState<Review[]>([]);
    const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        if (!supabase) return;
        setLoading(true);

        const { data: reviewsData } = await supabase
            .from('service_reviews')
            .select(`*, review_replies (*)`)
            .order('created_at', { ascending: false });
        if (reviewsData) setReviews(reviewsData);

        const { data: feedbackData } = await supabase
            .from('content_votes')
            .select('*')
            .eq('vote_type', 'down')
            .order('created_at', { ascending: false });

        if (feedbackData && feedbackData.length > 0) {
            const articleIds = feedbackData.filter(f => f.entity_type === 'article').map(f => f.entity_id).filter(Boolean);
            const serviceIds = feedbackData.filter(f => f.entity_type === 'service').map(f => f.entity_id).filter(Boolean);
            const updateIds  = feedbackData.filter(f => f.entity_type === 'update').map(f => f.entity_id).filter(Boolean);

            const [articlesRes, servicesRes, updatesRes] = await Promise.all([
                articleIds.length  ? supabase.from('articles').select('id, title').in('id', articleIds)          : Promise.resolve({ data: [] }),
                serviceIds.length  ? supabase.from('service_providers').select('id, name').in('id', serviceIds)  : Promise.resolve({ data: [] }),
                updateIds.length   ? supabase.from('updates').select('id, title').in('id', updateIds)            : Promise.resolve({ data: [] }),
            ]);

            const entityMap: Record<string, string> = {};
            (articlesRes.data  || []).forEach((a: EntityRecord) => entityMap[a.id] = a.title || '');
            (servicesRes.data  || []).forEach((s: EntityRecord) => entityMap[s.id] = s.name || '');
            (updatesRes.data   || []).forEach((u: EntityRecord) => entityMap[u.id] = u.title || '');

            setFeedbackItems(feedbackData.map(f => ({ ...f, entity_title: entityMap[f.entity_id] || null })));
        } else {
            setFeedbackItems(feedbackData || []);
        }

        setLoading(false);
    };

    // ── Reviews ──────────────────────────────────────────────
    const handleDeleteReview = async (id: string) => {
        if (!supabase) return;
        // Optimistic: remove immediately
        setReviews(prev => prev.filter(r => r.id !== id));
        const { error } = await supabase.from('service_reviews').delete().eq('id', id);
        if (!error) {
            toast.success('تم حذف التقييم');
        } else {
            toast.error('فشل الحذف: ' + error.message);
            fetchData(); // revert
        }
    };

    const handleReply = async (reviewId: string) => {
        if (!supabase || !replyContent.trim()) return;
        const { error } = await supabase.from('review_replies').insert([{
            review_id: reviewId, author_name: 'الإدارة', content: replyContent, is_official: true
        }]);
        if (!error) {
            toast.success('تم إرسال الرد');
            // إشعار للمقيّم عند رد الإدارة
            const review = reviews.find((r: Review) => r.id === reviewId);
            if (review?.user_id) {
                createNotification({
                    type: 'reply',
                    title: 'ردّ من الإدارة على تقييمك',
                    message: `ردّت إدارة الموقع على تقييمك: "${replyContent.substring(0, 80)}${replyContent.length > 80 ? '...' : ''}"`,
                    link: `/services/${review.service_id}#reviews-section`,
                    icon: '💬',
                    priority: 'high',
                    target_user_id: review.user_id,
                });
            }
            setReplyContent(''); setReplyingTo(null); fetchData();
        }
        else toast.error('فشل الإرسال: ' + error.message);
    };

    // ── Feedback ─────────────────────────────────────────────
    const handleResolveFeedback = async (id: string) => {
        // Optimistic: hide immediately
        setFeedbackItems(prev => prev.filter(i => i.id !== id));
        // Use server-side API route — the browser supabase client (anon key) loses
        // the session because it reads from localStorage, but the session is stored
        // in HTTP-only cookies. The API route uses createServerClient which reads
        // cookies correctly, so is_admin() returns true and RLS allows the delete.
        const res = await fetch(`/api/admin/feedback?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
            toast.success('تمت المعالجة وحُذفت من القائمة');
        } else {
            const data = await res.json().catch(() => ({}));
            toast.error('فشل الحذف: ' + (data.error || 'خطأ غير معروف'));
            fetchData(); // revert on failure
        }
    };

    // رابط صفحة التعديل في لوحة الإدارة (للمراجعة والإصلاح)
    function getAdminEditUrl(type: string, id: string): string {
        switch (type) {
            case 'article':  return `/admin/articles/${id}`;
            case 'service':  return `/admin/services?id=${id}`;
            case 'update':   return `/admin/updates`;
            case 'scenario': return `/admin/scenarios`;
            case 'zone':     return `/admin/zones`;
            case 'faq':      return `/admin/faqs`;
            default:         return '/admin';
        }
    }

    // رابط المعاينة العامة (نافذة جديدة)
    function getPublicUrl(type: string, id: string): string {
        switch (type) {
            case 'article':  return `/article/${id}`;
            case 'service':  return `/services/${id}`;
            case 'update':   return `/updates#upd-${id}`;
            case 'scenario': return id?.startsWith('code-') ? `/codes/${id.replace('code-', '')}` : `/consultant?scenario=${id}`;
            case 'zone':     return `/zones/${id}`;
            case 'faq':      return `/faq`;
            default:         return '#';
        }
    }

    function entityTypeLabel(type: string): string {
        const map: Record<string, string> = {
            article:  'مقال',
            service:  'خدمة',
            update:   'تحديث',
            scenario: 'سيناريو استشاري',
            zone:     'منطقة',
            faq:      'سؤال شائع',
        };
        return map[type] || type;
    }

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
                    onClick={() => setActiveTab('feedback')}
                    className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'feedback'
                        ? 'border-amber-500 text-amber-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <FileWarning size={16} />
                    الملاحظات ({feedbackItems.length})
                </button>
                <button
                    onClick={() => setActiveTab('reviews')}
                    className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'reviews'
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Star size={16} />
                    التقييمات ({reviews.length})
                </button>
            </div>

            {/* FEEDBACK TAB */}
            {activeTab === 'feedback' && (
                <div className="grid gap-4">
                    {feedbackItems.length === 0 ? (
                        <div className="text-center py-20 text-slate-400">
                            <FileWarning size={48} className="mx-auto mb-4 opacity-30" />
                            <p className="font-bold">لا توجد ملاحظات سلبية — ممتاز!</p>
                        </div>
                    ) : (
                        feedbackItems.map((item) => (
                            <div key={item.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border-r-4 border-r-amber-500 border border-slate-200 dark:border-slate-800 overflow-hidden">
                                {/* Header */}
                                <div className="px-5 py-4 bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/30 flex items-center justify-between gap-3 flex-wrap">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5">
                                            <AlertTriangle size={12} />
                                            {item.reason || 'ملاحظة سلبية'}
                                        </span>
                                        <span className="text-xs text-slate-400 font-mono">
                                            {entityTypeLabel(item.entity_type)}
                                        </span>
                                        {/* عنوان المحتوى — معاينة عامة في نافذة جديدة */}
                                        {item.entity_id && (
                                            <Link
                                                href={getPublicUrl(item.entity_type, item.entity_id)}
                                                target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 transition-colors max-w-xs truncate"
                                                title="معاينة المحتوى كما يراه الزائر"
                                            >
                                                <Eye size={13} className="shrink-0" />
                                                {item.entity_title || 'معاينة المحتوى'}
                                            </Link>
                                        )}
                                    </div>
                                    <span className="text-xs text-slate-400 whitespace-nowrap">
                                        {new Date(item.created_at).toLocaleDateString('ar-EG')}
                                    </span>
                                </div>

                                {/* Body */}
                                <div className="px-5 py-4">
                                    {(item.feedback || item.reason) ? (
                                        <p className="text-slate-800 dark:text-slate-100 leading-relaxed">
                                            {item.feedback || item.reason}
                                        </p>
                                    ) : (
                                        <p className="text-slate-400 italic text-sm">لم يترك الزائر تعليقاً نصياً</p>
                                    )}
                                </div>

                                {/* Footer: actions */}
                                <div className="px-5 pb-4 flex items-center justify-between gap-3 flex-wrap">
                                    {/* زر التعديل في لوحة الإدارة */}
                                    <Link
                                        href={getAdminEditUrl(item.entity_type, item.entity_id)}
                                        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors"
                                        title="فتح المحتوى في محرر الإدارة"
                                    >
                                        <ArrowRight size={16} className="rotate-180" />
                                        تعديل في لوحة الإدارة
                                    </Link>

                                    {/* زر إنهاء المعالجة — يحذف فوراً بدون confirm */}
                                    <button
                                        onClick={() => handleResolveFeedback(item.id)}
                                        className="flex items-center gap-2 text-sm font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-4 py-2 rounded-xl transition-colors border border-emerald-200 dark:border-emerald-800"
                                    >
                                        <CheckCircle2 size={18} />
                                        تمت المعالجة
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* REVIEWS TAB */}
            {activeTab === 'reviews' && (
                <div className="grid gap-6">
                    {reviews.length === 0 ? (
                        <div className="text-center py-20 text-slate-400">
                            <Star size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="font-bold">لا توجد تقييمات</p>
                        </div>
                    ) : (
                        reviews.map((review) => (
                            <div key={review.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg mb-1">{review.client_name}</h3>
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <div className="flex text-amber-400">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={14} fill={i < review.rating ? 'currentColor' : 'none'} className={i < review.rating ? 'text-amber-400' : 'text-slate-200'} />
                                                ))}
                                            </div>
                                            <span>• {review.service_name || 'خدمة'} •</span>
                                            <span>{new Date(review.created_at).toLocaleDateString('ar-EG')}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteReview(review.id)}
                                        className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors"
                                        title="حذف التقييم"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                                <p className="text-slate-700 dark:text-slate-300 mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">"{review.comment}"</p>

                                {/* Replies */}
                                <div className="space-y-4">
                                    {review.review_replies?.slice().sort((a: ReviewReply, b: ReviewReply) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map((reply: ReviewReply) => (
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
                                            <input
                                                className="flex-1 border rounded-xl p-3 dark:bg-slate-800 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                value={replyContent}
                                                onChange={e => setReplyContent(e.target.value)}
                                                placeholder="اكتب رد الإدارة..."
                                                autoFocus
                                            />
                                            <button onClick={() => handleReply(review.id)} className="bg-emerald-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-emerald-700">إرسال</button>
                                            <button onClick={() => setReplyingTo(null)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">إلغاء</button>
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
        </div>
    );
}
