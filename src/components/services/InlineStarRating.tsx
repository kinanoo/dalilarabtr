'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Star, Send, LogIn, X, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { addReview, hasUserReviewed, getUserReview, updateReview, deleteReview } from '@/lib/api/reviews';
import { postComment } from '@/lib/api/comments';

interface InlineStarRatingProps {
    serviceId: string;
    serviceName: string;
    currentRating: number;
    reviewCount: number;
}

export default function InlineStarRating({
    serviceId,
    serviceName,
    currentRating,
    reviewCount,
}: InlineStarRatingProps) {
    // Auth state
    const [isGuest, setIsGuest] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [alreadyReviewed, setAlreadyReviewed] = useState(false);
    const [myRating, setMyRating] = useState(0); // User's existing rating

    // Interaction state
    const [hoverRating, setHoverRating] = useState(0);
    const [showPopup, setShowPopup] = useState(false);
    const [popupMode, setPopupMode] = useState<'new' | 'edit'>('new');
    const [selectedRating, setSelectedRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [displayRating, setDisplayRating] = useState(currentRating);
    const [displayCount, setDisplayCount] = useState(reviewCount);

    const popupRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Auth check + fetch existing review
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
                const { data: existingReview } = await getUserReview(serviceId, user.id);
                if (existingReview) {
                    setAlreadyReviewed(true);
                    setMyRating(existingReview.rating);
                }
            }
        });
    }, [serviceId]);

    // Click outside to close popup
    useEffect(() => {
        if (!showPopup && !showConfirmDelete) return;

        function handleClickOutside(e: MouseEvent) {
            if (popupRef.current && !popupRef.current.contains(e.target as Node) &&
                containerRef.current && !containerRef.current.contains(e.target as Node)) {
                closePopup();
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showPopup, showConfirmDelete]);

    const closePopup = () => {
        setShowPopup(false);
        setShowConfirmDelete(false);
        setSelectedRating(0);
        setComment('');
    };

    const handleStarClick = useCallback((star: number) => {
        if (isGuest) {
            setShowLoginModal(true);
            return;
        }
        if (alreadyReviewed) {
            // Open edit mode with current rating
            setPopupMode('edit');
            setSelectedRating(star);
            setShowPopup(true);
            return;
        }
        setPopupMode('new');
        setSelectedRating(star);
        setShowPopup(true);
    }, [isGuest, alreadyReviewed]);

    // Submit new review
    const handleSubmit = async () => {
        if (selectedRating === 0 || submitting) return;
        setSubmitting(true);

        const { error } = await addReview({
            service_id: serviceId,
            service_name: serviceName,
            reviewer_name: 'عضو مسجّل',
            rating: selectedRating,
            comment: comment.trim() || undefined,
            user_id: userId || undefined,
        });

        setSubmitting(false);

        if (error) {
            if (error.code === '23505') {
                setAlreadyReviewed(true);
            }
            return;
        }

        // If there's a comment, also post it to the comments section
        if (comment.trim()) {
            const stars = '★'.repeat(selectedRating) + '☆'.repeat(5 - selectedRating);
            await postComment({
                entity_type: 'service',
                entity_id: serviceId,
                author_name: 'عضو مسجّل',
                content: `${stars} — ${comment.trim()}`,
                user_id: userId || undefined,
            });
        }

        // Optimistic UI update
        const newCount = displayCount + 1;
        const newRating = ((displayRating * displayCount) + selectedRating) / newCount;
        setDisplayRating(newRating);
        setDisplayCount(newCount);
        setAlreadyReviewed(true);
        setMyRating(selectedRating);

        showSuccess('شكراً لتقييمك!');
    };

    // Update existing review
    const handleUpdate = async () => {
        if (selectedRating === 0 || submitting || !userId) return;
        setErrorMsg('');
        setSubmitting(true);

        const { success: ok, error } = await updateReview(serviceId, userId, {
            rating: selectedRating,
        });

        setSubmitting(false);
        if (!ok) {
            setErrorMsg(error?.message || 'فشل تحديث التقييم');
            return;
        }

        // Optimistic: recalculate average (remove old, add new)
        if (displayCount > 0) {
            const totalWithoutMine = (displayRating * displayCount) - myRating;
            const newRating = (totalWithoutMine + selectedRating) / displayCount;
            setDisplayRating(newRating);
        }
        setMyRating(selectedRating);

        showSuccess('تم تحديث تقييمك');
    };

    // Delete review
    const handleDelete = async () => {
        if (submitting || !userId) return;
        setErrorMsg('');
        setSubmitting(true);

        const { success: ok, error } = await deleteReview(serviceId, userId);

        setSubmitting(false);
        if (!ok) {
            setShowConfirmDelete(false);
            setErrorMsg(error?.message || 'فشل حذف التقييم');
            return;
        }

        // Optimistic: remove from average
        if (displayCount > 1) {
            const totalWithoutMine = (displayRating * displayCount) - myRating;
            const newCount = displayCount - 1;
            setDisplayRating(totalWithoutMine / newCount);
            setDisplayCount(newCount);
        } else {
            setDisplayRating(0);
            setDisplayCount(0);
        }
        setAlreadyReviewed(false);
        setMyRating(0);

        showSuccess('تم حذف تقييمك');
    };

    const showSuccess = (msg: string) => {
        setSuccessMsg(msg);
        setSuccess(true);
        setTimeout(() => {
            setSuccess(false);
            setSuccessMsg('');
            closePopup();
        }, 1500);
    };

    // Which rating to show in the stars (hover > selected > current average)
    const activeRating = hoverRating || (showPopup ? selectedRating : 0);

    return (
        <>
            <div ref={containerRef} className="relative">
                {/* Stars + Rating Display */}
                <div className="flex items-center justify-center sm:justify-end gap-1.5 group">
                    {/* Interactive Stars */}
                    <div className="flex items-center gap-0.5 cursor-pointer" dir="ltr">
                        {[1, 2, 3, 4, 5].map((star) => {
                            const filled = activeRating
                                ? star <= activeRating
                                : star <= Math.round(displayRating);
                            return (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => handleStarClick(star)}
                                    onMouseEnter={() => !showPopup && setHoverRating(star)}
                                    onMouseLeave={() => !showPopup && setHoverRating(0)}
                                    className="transition-transform hover:scale-110 active:scale-95 p-0"
                                    aria-label={`${star} نجوم`}
                                >
                                    <Star
                                        size={18}
                                        className={
                                            filled
                                                ? 'fill-amber-500 text-amber-500'
                                                : 'text-slate-300 dark:text-slate-600'
                                        }
                                    />
                                </button>
                            );
                        })}
                    </div>

                    {/* Rating Number + Count */}
                    <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 px-2.5 py-1 rounded-lg border border-amber-100 dark:border-amber-900/50">
                        <span className="font-bold text-sm">
                            {displayRating ? displayRating.toFixed(1) : '5.0'}
                        </span>
                        <span className="text-xs opacity-70">
                            ({displayCount} تقييم)
                        </span>
                    </div>
                </div>

                {/* Rating Popup — New or Edit */}
                {showPopup && !success && !showConfirmDelete && (
                    <div
                        ref={popupRef}
                        className="absolute top-full mt-3 left-0 sm:left-auto sm:right-0 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-5 z-50 w-[300px] animate-in fade-in slide-in-from-top-2 duration-200"
                    >
                        {/* Popup Stars */}
                        <div className="text-center mb-4">
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                                {popupMode === 'edit' ? 'تعديل تقييمك' : 'تقييمك'}
                            </p>
                            <div className="flex items-center justify-center gap-1" dir="ltr">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setSelectedRating(star)}
                                        className="transition-transform hover:scale-125 active:scale-95"
                                    >
                                        <Star
                                            size={28}
                                            className={
                                                star <= selectedRating
                                                    ? 'fill-amber-400 text-amber-400'
                                                    : 'text-slate-300 dark:text-slate-600'
                                            }
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Optional Comment (new only) */}
                        {popupMode === 'new' && (
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                rows={2}
                                placeholder="أضف تعليقاً (اختياري)..."
                            />
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-3">
                            <button
                                onClick={popupMode === 'edit' ? handleUpdate : handleSubmit}
                                disabled={submitting || selectedRating === 0}
                                className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all text-sm active:scale-95 shadow-md"
                            >
                                {submitting ? (
                                    <span>جاري الإرسال...</span>
                                ) : popupMode === 'edit' ? (
                                    <>
                                        <Pencil size={14} />
                                        تحديث التقييم
                                    </>
                                ) : (
                                    <>
                                        <Send size={14} />
                                        إرسال التقييم
                                    </>
                                )}
                            </button>
                            <button
                                onClick={closePopup}
                                className="px-3 py-2.5 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-bold"
                            >
                                إلغاء
                            </button>
                        </div>

                        {/* Error message */}
                        {errorMsg && (
                            <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg text-xs text-red-600 dark:text-red-400 font-bold text-center">
                                {errorMsg}
                            </div>
                        )}

                        {/* Delete option (edit mode only) */}
                        {popupMode === 'edit' && (
                            <button
                                onClick={() => setShowConfirmDelete(true)}
                                className="w-full mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
                            >
                                <Trash2 size={13} />
                                حذف تقييمي
                            </button>
                        )}
                    </div>
                )}

                {/* Delete Confirmation */}
                {showConfirmDelete && !success && (
                    <div
                        ref={popupRef}
                        className="absolute top-full mt-3 left-0 sm:left-auto sm:right-0 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-red-200 dark:border-red-900/50 p-5 z-50 w-[280px] animate-in fade-in zoom-in-95 duration-200 text-center"
                    >
                        <Trash2 size={24} className="text-red-500 mx-auto mb-3" />
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">حذف التقييم؟</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">سيتم حذف تقييمك نهائياً</p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleDelete}
                                disabled={submitting}
                                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-bold py-2 px-3 rounded-xl text-sm transition-all active:scale-95"
                            >
                                {submitting ? 'جاري الحذف...' : 'نعم، احذف'}
                            </button>
                            <button
                                onClick={() => setShowConfirmDelete(false)}
                                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2 px-3 rounded-xl text-sm transition-colors"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                )}

                {/* Success Message */}
                {showPopup && success && (
                    <div
                        ref={popupRef}
                        className="absolute top-full mt-3 left-0 sm:left-auto sm:right-0 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-emerald-200 dark:border-emerald-800 p-5 z-50 w-[280px] animate-in fade-in zoom-in-95 duration-200 text-center"
                    >
                        <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
                        <h4 className="font-bold text-emerald-600 dark:text-emerald-400 text-base">{successMsg}</h4>
                    </div>
                )}
            </div>

            {/* Login Modal */}
            {showLoginModal && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setShowLoginModal(false)}
                >
                    <div
                        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full text-center animate-in zoom-in-95 slide-in-from-bottom-2 duration-300 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowLoginModal(false)}
                            className="absolute top-3 left-3 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-400"
                        >
                            <X size={16} />
                        </button>

                        <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Star size={28} className="text-amber-500" />
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                            التقييم للأعضاء فقط
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-5">
                            سجّل دخولك لتتمكن من تقييم الخدمات. مشاركتك تساعد الآخرين في اتخاذ قراراتهم.
                        </p>

                        <div className="flex flex-col gap-2">
                            <Link
                                href="/login"
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-emerald-600/20"
                            >
                                <LogIn size={18} />
                                تسجيل الدخول
                            </Link>
                            <button
                                onClick={() => setShowLoginModal(false)}
                                className="w-full text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold py-2 px-4 rounded-xl transition-colors text-sm"
                            >
                                ليس الآن
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
