'use client';

import { useEffect, useState } from 'react';
import { Loader2, SlidersHorizontal } from 'lucide-react';
import ReviewCard from './ReviewCard';
import { getServiceReviews, type ServiceReview } from '@/lib/api/reviews';

interface ReviewsListProps {
    serviceId: string;
    limit?: number;
}

export default function ReviewsList({ serviceId, limit = 10 }: ReviewsListProps) {
    const [reviews, setReviews] = useState<ServiceReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [orderBy, setOrderBy] = useState<'newest' | 'highest' | 'helpful'>('newest');
    const [showMore, setShowMore] = useState(false);

    useEffect(() => {
        loadReviews();
    }, [serviceId, orderBy]);

    const loadReviews = async () => {
        setLoading(true);
        const { data } = await getServiceReviews(serviceId, {
            limit: showMore ? 100 : limit,
            orderBy,
        });
        setReviews(data);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 size={32} className="animate-spin text-emerald-600" />
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-slate-500 dark:text-slate-400 mb-2">
                    لا توجد تقييمات بعد
                </div>
                <div className="text-sm text-slate-400 dark:text-slate-500">
                    كن أول من يُقيّم هذه الخدمة!
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Sort Options */}
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                    التقييمات ({reviews.length})
                </h3>
                <div className="flex items-center gap-2">
                    <SlidersHorizontal size={16} className="text-slate-500" />
                    <select
                        value={orderBy}
                        onChange={(e) => setOrderBy(e.target.value as any)}
                        className="text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                    >
                        <option value="newest">الأحدث</option>
                        <option value="highest">الأعلى تقييماً</option>
                        <option value="helpful">الأكثر فائدة</option>
                    </select>
                </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-3">
                {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                ))}
            </div>

            {/* Load More */}
            {!showMore && reviews.length >= limit && (
                <button
                    onClick={() => {
                        setShowMore(true);
                        loadReviews();
                    }}
                    className="w-full py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                    عرض المزيد
                </button>
            )}
        </div>
    );
}
