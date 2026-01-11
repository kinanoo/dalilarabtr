'use client';

import { useState } from 'react';
import { X, Star, Send } from 'lucide-react';
import { addReview, type AddReviewData } from '@/lib/api/reviews';

interface AddReviewModalProps {
    serviceId: string;
    serviceName: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function AddReviewModal({
    serviceId,
    serviceName,
    isOpen,
    onClose,
    onSuccess,
}: AddReviewModalProps) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [name, setName] = useState('');
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation - Only Rating is STRICTLY required
        if (rating === 0) {
            setError('الرجاء اختيار تقييم (النجوم)');
            return;
        }

        setSubmitting(true);

        const reviewData: AddReviewData = {
            service_id: serviceId,
            service_name: serviceName,
            reviewer_name: name.trim() || 'فاعل خير', // Default name
            rating,
            comment: comment.trim(), // Optional
        };

        const { data, error: apiError } = await addReview(reviewData);

        setSubmitting(false);

        if (apiError) {
            console.error('Review Error:', apiError);
            setError('حدث خطأ: ' + (apiError.message || apiError.details || JSON.stringify(apiError)));
            return;
        }

        // Success
        setSuccess(true);
        setTimeout(() => {
            onClose();
            onSuccess?.();
            // Reset form
            setRating(0);
            setName('');
            setComment('');
            setSuccess(false);
        }, 1500);
    };

    const renderStarSelector = () => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition-transform hover:scale-125"
                    >
                        <Star
                            size={32}
                            className={
                                star <= (hoverRating || rating)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-300 dark:text-slate-600'
                            }
                        />
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        قيم تجربتك
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Success Message */}
                {success ? (
                    <div className="p-8 text-center">
                        <div className="text-6xl mb-4">✅</div>
                        <h3 className="text-2xl font-bold text-emerald-600 mb-2">تم الإرسال!</h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            شكراً لمشاركتك.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Service Name */}
                        <div className="text-sm text-center text-slate-500 dark:text-slate-400 mb-4">
                            ما رأيك في: <span className="font-bold text-emerald-600 block text-lg mt-1">{serviceName}</span>
                        </div>

                        {/* Rating */}
                        <div className="flex flex-col items-center gap-2">
                            {renderStarSelector()}
                            <span className="text-xs text-slate-400">اضغط لتختار عدد النجوم</span>
                        </div>

                        {/* Name */}
                        <div>
                            <label className="block font-bold text-slate-800 dark:text-slate-100 mb-2 text-sm">
                                الاسم (اختياري)
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                                placeholder="فاعل خير"
                            />
                        </div>

                        {/* Comment */}
                        <div>
                            <label className="block font-bold text-slate-800 dark:text-slate-100 mb-2 text-sm">
                                ملاحظاتك (اختياري)
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 resize-none"
                                rows={3}
                                placeholder="اكتب تعليقاً مختصراً إذا أحببت..."
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm text-center">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold py-3 px-6 rounded-xl transition shadow-lg shadow-emerald-900/20"
                        >
                            {submitting ? (
                                <>جاري الإرسال...</>
                            ) : (
                                <>
                                    <Send size={18} />
                                    إرسال التقييم
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
