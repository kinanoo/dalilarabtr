'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { voteContent } from '@/lib/api/comments';
import { toast } from 'sonner';

interface ContentHelpfulWidgetProps {
    entityType: string;
    entityId: string;
    className?: string;
}

export default function ContentHelpfulWidget({ entityType, entityId, className }: ContentHelpfulWidgetProps) {
    const [voted, setVoted] = useState<'up' | 'down' | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Check for previous vote
    useEffect(() => {
        const key = `vote_${entityType}_${entityId}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                const { type, expiry } = JSON.parse(saved);
                if (expiry > Date.now()) {
                    setVoted(type);
                } else {
                    localStorage.removeItem(key);
                }
            } catch (e) {
                localStorage.removeItem(key);
            }
        }
    }, [entityType, entityId]);

    const handleVote = async (type: 'up' | 'down') => {
        if (voted) return;

        if (type === 'down') {
            setShowFeedback(true);
            return;
        }

        submitVote(type);
    };

    const submitVote = async (type: 'up' | 'down', feedbackText?: string, reasonText?: string) => {
        const { error } = await voteContent(entityType, entityId, type, feedbackText, reasonText);

        if (error) {
            console.error(error);
            toast.error('حدث خطأ في استلام تقييمك');
        } else {
            setVoted(type);
            // Save to LocalStorage (7 Days)
            try {
                localStorage.setItem(`vote_${entityType}_${entityId}`, JSON.stringify({
                    type,
                    expiry: Date.now() + 604800000 // 7 days
                }));
            } catch (e) { /* ignore storage errors */ }

            toast.success(type === 'up' ? 'شكراً لك! يسعدنا أنك استفدت.' : 'شكراً لملاحظتك، سنعمل على التحسين.');
        }
    };

    const handleSubmitFeedback = async () => {
        if (!reason && !feedback) {
            toast.error('يرجى توضيح السبب أو كتابة ملاحظة');
            return;
        }
        setIsSubmitting(true);
        await submitVote('down', feedback, reason);
        setIsSubmitting(false);
        setShowFeedback(false);
    };

    if (voted) {
        return (
            <div className={`flex items-center gap-2 text-sm font-bold text-slate-500 animate-in fade-in ${className}`}>
                {voted === 'up' ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                        <ThumbsUp size={16} /> شكراً لتفاعلك!
                    </span>
                ) : (
                    <span className="text-slate-500 flex items-center gap-1">
                        <ThumbsDown size={16} /> شكراً لملاحظتك.
                    </span>
                )}
            </div>
        );
    }

    if (showFeedback) {
        return (
            <div className={`w-full p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 ${className}`}>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">لماذا لم يكن المحتوى مفيداً؟</h4>

                <div className="flex flex-wrap gap-2">
                    {['معلومات غير دقيقة', 'قديم', 'غير واضح', 'أخرى'].map(r => (
                        <button
                            type="button"
                            key={r}
                            onClick={() => setReason(r)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${reason === r
                                ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900'
                                : 'bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                        >
                            {r}
                        </button>
                    ))}
                </div>

                <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="اكتب التصحيح أو ملاحظاتك هنا..."
                    className="w-full text-sm p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 resize-none min-h-[80px]"
                />

                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => setShowFeedback(false)}
                        className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                    >
                        إلغاء
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmitFeedback}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:opacity-90 transition disabled:opacity-50"
                    >
                        {isSubmitting ? 'جاري الإرسال...' : 'إرسال الملاحظات'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`w-full flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm ${className}`}>
            <span className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-300">
                هل كان هذا المحتوى مفيداً؟
            </span>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => handleVote('up')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 transition-colors text-sm font-bold text-slate-600 dark:text-slate-400"
                >
                    <ThumbsUp size={14} />
                    نعم
                </button>
                <button
                    type="button"
                    onClick={() => handleVote('down')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-red-500 hover:text-red-600 transition-colors text-sm font-bold text-slate-600 dark:text-slate-400"
                >
                    <ThumbsDown size={14} />
                    لا
                </button>
            </div>
        </div>
    );
}
