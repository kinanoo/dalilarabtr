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
    const [email, setEmail] = useState('');
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (rating === 0) {
            setError('الرجاء اختيار تقييم');
            return;
        }
        if (name.trim().length < 2) {
            setError('الرجاء إدخال اسمك');
            return;
        }
        if (comment.trim().length < 10) {
            setError('الرجاء كتابة تعليق (10 أحرف على الأقل)');
            return;
        }

        setSubmitting(true);

        const reviewData: AddReviewData = {
            service_id: serviceId,
            service_name: serviceName,
            reviewer_name: name.trim(),
            reviewer_email: email.trim() || undefined,
            rating,
            comment: comment.trim(),
        };

        const { data, error: apiError } = await addReview(reviewData);

        setSubmitting(false);

        if (apiError) {
            setError('حدث خطأ. الرجاء المحاولة مرة أخرى.');
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
            setEmail('');
            setComment('');
            setSuccess(false);
        }, 2000);
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
                        أضف تقييمك
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
                        <h3 className="text-2xl font-bold text-emerald-600 mb-2">شكراً لك!</h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            تم إرسال تقييمك بنجاح. سيظهر بعد مراجعته من قبل الإدارة.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Service Name */}
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                            تقييم: <span className="font-bold text-slate-800 dark:text-slate-100">{serviceName}</span>
                        </div>

                        {/* Rating */}
                        <div>
                            <label className="block font-bold text-slate-800 dark:text-slate-100 mb-2">
                                التقييم
                            </label>
                            {renderStarSelector()}
                        </div>

                        {/* Name */}
                        <div>
                            <label className="block font-bold text-slate-800 dark:text-slate-100 mb-2">
                                الاسم <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                                placeholder="اسمك أو اسم مستعار"
                                required
                            />
                        </div>

                        {/* Email (Optional) */}
                        <div>
                            <label className="block font-bold text-slate-800 dark:text-slate-100 mb-2">
                                البريد الإلكتروني (اختياري)
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                                placeholder="your@email.com"
                            />
                        </div>

                        {/* Comment */}
                        <div>
                            <label className="block font-bold text-slate-800 dark:text-slate-100 mb-2">
                                التعليق <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 resize-none"
                                rows={4}
                                placeholder="شاركنا تجربتك مع هذه الخدمة..."
                                required
                                minLength={10}
                            />
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {comment.length} / 10 أحرف على الأقل
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold py-3 px-6 rounded-lg transition"
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

                        <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                            سيتم مراجعة تقييمك قبل نشره. شكراً لك!
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}
