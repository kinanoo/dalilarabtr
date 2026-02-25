'use client';

import { useState, useEffect } from 'react';
import { Star, User, ThumbsUp, MessageCircle, CheckCircle2, LogIn } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { createBrowserClient } from '@supabase/ssr';
import AddReviewModal from '@/components/reviews/AddReviewModal';
import Link from 'next/link';

interface ReviewsProps {
    serviceId: string;
    serviceName?: string; // Passed to modal
}

export default function ServiceReviews({ serviceId, serviceName = "الخدمة" }: ReviewsProps) {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGuest, setIsGuest] = useState(true);

    useEffect(() => {
        const sb = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        sb.auth.getUser().then(({ data }) => {
            setIsGuest(!data.user);
        });
    }, []);

    useEffect(() => {
        fetchReviews();
    }, [serviceId]);

    async function fetchReviews() {
        if (!supabase) return;

        // Fetch reviews AND their replies
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
            //.eq('is_approved', true) // Temporarily show all or strictly approved? Stick to approved logic if implemented.
            // For now, SQL script enabled auto-approve on insert, so we can fetch all or approved.
            .order('created_at', { ascending: false });

        if (data) setReviews(data);
        setLoading(false);
    }

    const handleHelpful = async (reviewId: string) => {
        // Optimistic UI update
        setReviews(prev => prev.map(r =>
            r.id === reviewId ? { ...r, helpful_count: (r.helpful_count || 0) + 1 } : r
        ));

        // Call database function logic (RPC)
        if (supabase) {
            await supabase.rpc('increment_helpful_count', { review_id: reviewId });
        }
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

                {isGuest ? (
                    <Link
                        href="/login"
                        className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-slate-600/20 flex items-center justify-center gap-2 active:scale-95"
                    >
                        <LogIn size={20} />
                        سجّل دخول لإضافة تقييم
                    </Link>
                ) : (
                    <button
                        onClick={() => setIsModalOpen(true)}
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
                    reviews.map((review) => (
                        <div key={review.id} className="group animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {/* Review Card */}
                            <div className="flex gap-4">
                                {/* Avatar */}
                                <div className="shrink-0 hidden md:block">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold text-lg shadow-inner">
                                        {review.client_name.charAt(0)}
                                    </div>
                                </div>

                                <div className="flex-1">
                                    {/* Reviewer Header */}
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-slate-900 dark:text-white">{review.client_name}</h4>
                                                {/* Simulated Verified Badge - In real app check review.is_verified */}
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
                                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4 text-base">
                                        {review.comment}
                                    </p>

                                    {/* Actions */}
                                    <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6 mb-6">
                                        <button
                                            onClick={() => handleHelpful(review.id)}
                                            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors group/btn"
                                        >
                                            <ThumbsUp size={14} className="group-hover/btn:-translate-y-0.5 transition-transform" />
                                            مفيد ({review.helpful_count || 0})
                                        </button>
                                        <button className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                            إبلاغ
                                        </button>
                                    </div>

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
                                                            P{new Date(reply.created_at).toLocaleDateString('ar-EG')}
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
                    ))
                )}
            </div>

            {/* Modal */}
            <AddReviewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                serviceId={serviceId}
                serviceName={serviceName}
                onSuccess={() => {
                    fetchReviews();
                    // Maybe show a success toast here via sonner if desired, but modal handles it nicely.
                }}
            />
        </div>
    );
}
