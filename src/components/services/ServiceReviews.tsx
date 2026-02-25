'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star, ThumbsUp, MessageCircle, CheckCircle2, Flag, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { createBrowserClient } from '@supabase/ssr';
import { hasUserReviewed, reportReview } from '@/lib/api/reviews';
import AddReviewModal from '@/components/reviews/AddReviewModal';

interface ReviewsProps {
    serviceId: string;
    serviceName?: string;
}

const HELPFUL_STORAGE_KEY = 'helpful_votes';
const REPORTED_STORAGE_KEY = 'reported_reviews';

const REPORT_REASONS = [
    { key: 'inappropriate', label: 'محتوى غير لائق' },
    { key: 'misleading', label: 'معلومات مغلوطة' },
    { key: 'fake', label: 'تقييم مزيف' },
];

function getStorageSet(key: string): Set<string> {
    try {
        const raw = localStorage.getItem(key);
        return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
        return new Set();
    }
}

function addToStorageSet(key: string, value: string) {
    const set = getStorageSet(key);
    set.add(value);
    try {
        localStorage.setItem(key, JSON.stringify([...set]));
    } catch {}
}

export default function ServiceReviews({ serviceId, serviceName = "الخدمة" }: ReviewsProps) {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGuest, setIsGuest] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [alreadyReviewed, setAlreadyReviewed] = useState(false);
    const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
    const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());
    const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);

    // Auth check + has-reviewed check
    useEffect(() => {
        const sb = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        sb.auth.getUser().then(async ({ data }) => {
            const user = data.user;
            setIsGuest(!user);
            if (user) {
                setUserId(user.id);
                const reviewed = await hasUserReviewed(serviceId, user.id);
                setAlreadyReviewed(reviewed);
            }
        });
    }, [serviceId]);

    // Load localStorage tracking
    useEffect(() => {
        setVotedIds(getStorageSet(HELPFUL_STORAGE_KEY));
        setReportedIds(getStorageSet(REPORTED_STORAGE_KEY));
    }, []);

    // Fetch reviews
    useEffect(() => {
        fetchReviews();
    }, [serviceId]);

    async function fetchReviews() {
        if (!supabase) return;

        const { data } = await supabase
            .from('service_reviews')
            .select(`
                *,
                review_replies (
                    id,
                    content,
                    author_name,
                    created_at,
                    is_official
                )
            `)
            .eq('service_id', serviceId)
            .order('created_at', { ascending: false });

        if (data) setReviews(data);
        setLoading(false);
    }

    const handleHelpful = useCallback(async (reviewId: string) => {
        // Already voted — do nothing
        if (votedIds.has(reviewId)) return;

        // Optimistic UI
        setReviews(prev => prev.map(r =>
            r.id === reviewId ? { ...r, helpful_count: (r.helpful_count || 0) + 1 } : r
        ));

        // Track in localStorage
        addToStorageSet(HELPFUL_STORAGE_KEY, reviewId);
        setVotedIds(prev => new Set(prev).add(reviewId));

        // Call RPC
        if (supabase) {
            await supabase.rpc('increment_helpful_count', { review_id: reviewId });
        }
    }, [votedIds]);

    const handleReport = useCallback(async (reviewId: string, reason: string) => {
        if (!userId) return;

        // Track locally
        addToStorageSet(REPORTED_STORAGE_KEY, reviewId);
        setReportedIds(prev => new Set(prev).add(reviewId));
        setReportingReviewId(null);

        // Save to DB
        await reportReview(reviewId, userId, reason);
    }, [userId]);

    const handleAddReviewClick = () => {
        if (isGuest) {
            window.location.href = '/login?message=' + encodeURIComponent('التقييم متاح حصرياً للأعضاء المسجلين. سجّل دخولك لمشاركة تجربتك.');
            return;
        }
        if (alreadyReviewed) return;
        setIsModalOpen(true);
    };

    return (
        <div id="reviews-section" className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 md:p-8">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h3 className="font-bold text-2xl flex items-center gap-2 text-slate-900 dark:text-white">
                        <Star className="text-amber-500 fill-amber-500" size={28} />
                        تقييمات العملاء
                        <span className="text-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full font-bold">
                            {reviews.length}
                        </span>
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                        آراء حقيقية من عملاء جربوا الخدمة
                    </p>
                </div>

                {alreadyReviewed ? (
                    <div className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm">
                        <CheckCircle2 size={18} className="text-emerald-500" />
                        لقد قيّمت هذه الخدمة
                    </div>
                ) : (
                    <button
                        onClick={handleAddReviewClick}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-95"
                    >
                        <MessageCircle size={20} />
                        أضف تقييمك
                    </button>
                )}
            </div>

            {/* List */}
            <div className="space-y-8">
                {reviews.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <Star size={32} />
                        </div>
                        <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-1">لا توجد تقييمات حتى الآن</h4>
                        <p className="text-slate-500 text-sm">كن أول من يشارك تجربته مع هذه الخدمة!</p>
                    </div>
                ) : (
                    reviews.map((review) => {
                        const isVoted = votedIds.has(review.id);
                        const isReported = reportedIds.has(review.id);
                        const isReporting = reportingReviewId === review.id;

                        return (
                            <div key={review.id} className="group animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="flex gap-4">
                                    {/* Avatar */}
                                    <div className="shrink-0 hidden md:block">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold text-lg shadow-inner">
                                            {review.client_name?.charAt(0) || '؟'}
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        {/* Reviewer Header */}
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-slate-900 dark:text-white">{review.client_name}</h4>
                                                    <span className="flex items-center gap-1 text-[10px] bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full font-bold border border-green-100 dark:border-green-800">
                                                        <CheckCircle2 size={10} /> موثوق
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="flex text-amber-400">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "text-amber-400" : "text-slate-200 dark:text-slate-700"} />
                                                        ))}
                                                    </div>
                                                    <span className="text-xs text-slate-400">• {new Date(review.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Comment */}
                                        {review.comment && (
                                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4 text-base">
                                                {review.comment}
                                            </p>
                                        )}

                                        {/* Actions */}
                                        <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6 mb-6">
                                            {/* Helpful Button */}
                                            <button
                                                onClick={() => handleHelpful(review.id)}
                                                disabled={isVoted}
                                                className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                                                    isVoted
                                                        ? 'text-emerald-600 dark:text-emerald-400 cursor-default'
                                                        : 'text-slate-500 hover:text-emerald-600 cursor-pointer'
                                                }`}
                                            >
                                                <ThumbsUp size={14} className={isVoted ? 'fill-current' : ''} />
                                                {isVoted ? 'مفيد' : 'مفيد'} ({review.helpful_count || 0})
                                            </button>

                                            {/* Report Button */}
                                            {isReported ? (
                                                <span className="flex items-center gap-1.5 text-xs font-bold text-orange-500">
                                                    <AlertTriangle size={12} />
                                                    تم الإبلاغ
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        if (isGuest) {
                                                            window.location.href = '/login?message=' + encodeURIComponent('الإبلاغ عن التقييمات متاح للأعضاء المسجلين فقط.');
                                                            return;
                                                        }
                                                        setReportingReviewId(isReporting ? null : review.id);
                                                    }}
                                                    className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                                >
                                                    <Flag size={12} />
                                                    إبلاغ
                                                </button>
                                            )}
                                        </div>

                                        {/* Inline Report Reasons */}
                                        {isReporting && (
                                            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
                                                <p className="text-xs font-bold text-red-700 dark:text-red-300 mb-2">اختر سبب الإبلاغ:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {REPORT_REASONS.map(r => (
                                                        <button
                                                            key={r.key}
                                                            onClick={() => handleReport(review.id, r.key)}
                                                            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                                        >
                                                            {r.label}
                                                        </button>
                                                    ))}
                                                    <button
                                                        onClick={() => setReportingReviewId(null)}
                                                        className="text-xs font-bold px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                                                    >
                                                        إلغاء
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Replies Section */}
                                        {review.review_replies && review.review_replies.length > 0 && (
                                            <div className="space-y-4 pr-4 border-r-2 border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-xl">
                                                {review.review_replies.map((reply: any) => (
                                                    <div key={reply.id} className="relative">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`font-bold text-sm ${reply.is_official ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                                                {reply.author_name}
                                                            </span>
                                                            {reply.is_official && (
                                                                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-bold">
                                                                    رد رسمي
                                                                </span>
                                                            )}
                                                            <span className="text-[10px] text-slate-400">
                                                                {new Date(reply.created_at).toLocaleDateString('ar-EG')}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                                            {reply.content}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modal */}
            <AddReviewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                serviceId={serviceId}
                serviceName={serviceName}
                userId={userId || undefined}
                onSuccess={() => {
                    fetchReviews();
                    setAlreadyReviewed(true);
                }}
            />
        </div>
    );
}
