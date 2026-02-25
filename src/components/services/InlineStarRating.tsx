'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Star, Send, LogIn, X, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { addReview, hasUserReviewed } from '@/lib/api/reviews';

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

    // Interaction state
    const [hoverRating, setHoverRating] = useState(0);
    const [showPopup, setShowPopup] = useState(false);
    const [selectedRating, setSelectedRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showAlreadyMsg, setShowAlreadyMsg] = useState(false);
    const [displayRating, setDisplayRating] = useState(currentRating);
    const [displayCount, setDisplayCount] = useState(reviewCount);

    const popupRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Auth check
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

    // Click outside to close popup
    useEffect(() => {
        if (!showPopup) return;

        function handleClickOutside(e: MouseEvent) {
            if (popupRef.current && !popupRef.current.contains(e.target as Node) &&
                containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowPopup(false);
                setSelectedRating(0);
                setComment('');
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showPopup]);

    const handleStarClick = useCallback((star: number) => {
        if (isGuest) {
            setShowLoginModal(true);
            return;
        }
        if (alreadyReviewed) {
            setShowAlreadyMsg(true);
            setTimeout(() => setShowAlreadyMsg(false), 2500);
            return;
        }
        setSelectedRating(star);
        setShowPopup(true);
    }, [isGuest, alreadyReviewed]);

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
                setShowPopup(false);
                setShowAlreadyMsg(true);
                setTimeout(() => setShowAlreadyMsg(false), 2500);
            }
            return;
        }

        // Success — update display optimistically
        const newCount = displayCount + 1;
        const newRating = ((displayRating * displayCount) + selectedRating) / newCount;
        setDisplayRating(newRating);
        setDisplayCount(newCount);
        setAlreadyReviewed(true);

        setSuccess(true);
        setTimeout(() => {
            setSuccess(false);
            setShowPopup(false);
            setSelectedRating(0);
            setComment('');
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

                {/* "Already reviewed" toast */}
                {showAlreadyMsg && (
                    <div className="absolute top-full mt-2 right-0 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg z-50 whitespace-nowrap animate-in fade-in slide-in-from-top-2 duration-200 flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-emerald-400" />
                        لقد قيّمت هذه الخدمة مسبقاً
                    </div>
                )}

                {/* Rating Popup */}
                {showPopup && !success && (
                    <div
                        ref={popupRef}
                        className="absolute top-full mt-3 left-0 sm:left-auto sm:right-0 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-5 z-50 w-[300px] animate-in fade-in slide-in-from-top-2 duration-200"
                    >
                        {/* Popup Stars */}
                        <div className="text-center mb-4">
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">تقييمك</p>
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

                        {/* Optional Comment */}
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            rows={2}
                            placeholder="أضف تعليقاً (اختياري)..."
                        />

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-3">
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || selectedRating === 0}
                                className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all text-sm active:scale-95 shadow-md"
                            >
                                {submitting ? (
                                    <span>جاري الإرسال...</span>
                                ) : (
                                    <>
                                        <Send size={14} />
                                        إرسال التقييم
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setShowPopup(false);
                                    setSelectedRating(0);
                                    setComment('');
                                }}
                                className="px-3 py-2.5 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-bold"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                )}

                {/* Success Message in Popup */}
                {showPopup && success && (
                    <div
                        ref={popupRef}
                        className="absolute top-full mt-3 left-0 sm:left-auto sm:right-0 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-emerald-200 dark:border-emerald-800 p-5 z-50 w-[280px] animate-in fade-in zoom-in-95 duration-200 text-center"
                    >
                        <div className="text-3xl mb-2">&#10003;</div>
                        <h4 className="font-bold text-emerald-600 dark:text-emerald-400 text-base">شكراً لتقييمك!</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">تقييمك يساعد الآخرين</p>
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
