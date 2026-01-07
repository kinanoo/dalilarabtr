import { Star } from 'lucide-react';
import type { ServiceReview } from '@/lib/api/reviews';

interface RatingSummaryProps {
    averageRating: number;
    totalReviews: number;
    ratingDistribution?: {
        '5': number;
        '4': number;
        '3': number;
        '2': number;
        '1': number;
    };
    compact?: boolean;
}

export default function RatingSummary({
    averageRating,
    totalReviews,
    ratingDistribution,
    compact = false,
}: RatingSummaryProps) {
    if (totalReviews === 0) {
        return (
            <div className="text-sm text-slate-500 dark:text-slate-400">
                لا توجد تقييمات بعد
            </div>
        );
    }

    const renderStars = (rating: number, size: 'sm' | 'lg' = 'sm') => {
        const starSize = size === 'sm' ? 16 : 24;
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={starSize}
                        className={
                            star <= Math.round(rating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300 dark:text-slate-600'
                        }
                    />
                ))}
            </div>
        );
    };

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                {renderStars(averageRating)}
                <span className="font-bold text-sm text-slate-700 dark:text-slate-300">
                    {averageRating.toFixed(1)}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                    ({totalReviews})
                </span>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            {/* Overall Rating */}
            <div className="flex items-center gap-4 mb-4">
                <div className="text-center">
                    <div className="text-4xl font-black text-slate-800 dark:text-slate-100">
                        {averageRating.toFixed(1)}
                    </div>
                    {renderStars(averageRating, 'lg')}
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {totalReviews} تقييم
                    </div>
                </div>

                {/* Rating Distribution */}
                {ratingDistribution && (
                    <div className="flex-1 space-y-1">
                        {[5, 4, 3, 2, 1].map((rating) => {
                            const count = ratingDistribution[rating.toString() as '1' | '2' | '3' | '4' | '5'] || 0;
                            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

                            return (
                                <div key={rating} className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 w-12">
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                            {rating}
                                        </span>
                                        <Star size={12} className="fill-amber-400 text-amber-400" />
                                    </div>
                                    <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-amber-400 transition-all"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 w-8 text-left">
                                        {count}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
