'use client';

import { useState } from 'react';
import { Star, ThumbsUp, Check } from 'lucide-react';
import type { ServiceReview } from '@/lib/api/reviews';
import { markReviewHelpful } from '@/lib/api/reviews';

interface ReviewCardProps {
    review: ServiceReview;
}

export default function ReviewCard({ review }: ReviewCardProps) {
    const [hasVoted, setHasVoted] = useState(false);
    const [localHelpfulCount, setLocalHelpfulCount] = useState(review.helpful_count);

    const handleHelpful = async () => {
        if (hasVoted) return;

        // استخدام IP (يمكن استبداله بـ session ID)
        const voterIp = 'user_' + Date.now(); // مؤقت - يُفضل استخدام IP حقيقي

        const { success } = await markReviewHelpful(review.id, voterIp);

        if (success) {
            setHasVoted(true);
            setLocalHelpfulCount(prev => prev + 1);
        }
    };

    const renderStars = () => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={16}
                        className={
                            star <= review.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300 dark:text-slate-600'
                        }
                    />
                ))}
            </div>
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'اليوم';
        if (diffDays === 1) return 'أمس';
        if (diffDays < 7) return `منذ ${diffDays} أيام`;
        if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسبوع`;
        return date.toLocaleDateString('ar-SA');
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                            {review.reviewer_name}
                        </span>
                        {review.is_verified && (
                            <span className="flex items-center gap-1 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                                <Check size={12} />
                                موثق
                            </span>
                        )}
                    </div>
                    {renderStars()}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(review.created_at)}
                </div>
            </div>

            {/* Comment */}
            <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-4">
                {review.comment}
            </p>

            {/* Helpful Button */}
            <button
                onClick={handleHelpful}
                disabled={hasVoted}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${hasVoted
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 cursor-not-allowed'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
            >
                <ThumbsUp size={14} className={hasVoted ? 'fill-current' : ''} />
                <span>{hasVoted ? 'شكراً!' : 'مفيد'}</span>
                {localHelpfulCount > 0 && (
                    <span className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                        {localHelpfulCount}
                    </span>
                )}
            </button>
        </div>
    );
}
