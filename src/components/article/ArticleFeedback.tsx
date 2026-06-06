'use client';

/**
 * ArticleFeedback — two-button widget at the end of an article:
 *   "هل كان المقال مفيداً؟ نعم / لا"
 *
 * Stores the vote against the article_feedback table via /api/article-feedback.
 * We thread the visitor_id from localStorage so a device only counts once per
 * article (the server upserts on conflict, letting the visitor flip their
 * vote).
 *
 * UX:
 *   - The widget collapses into a thank-you message after voting.
 *   - The user's vote is remembered in localStorage so it persists across page
 *     reloads (the visitor_id dedup makes this safe — re-clicking on a
 *     different device still counts).
 *   - For the "not helpful" path we surface an optional free-text follow-up
 *     hint pointing at /request so the user can tell us why.
 */

import { useEffect, useState } from 'react';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { toast } from 'sonner';

const VISITOR_KEY = 'anon_comment_id';
const VOTE_KEY_PREFIX = 'article_feedback_vote:';

function getOrCreateVisitorId(): string {
    if (typeof window === 'undefined') return '';
    try {
        let v = localStorage.getItem(VISITOR_KEY);
        if (!v) {
            v = `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
            localStorage.setItem(VISITOR_KEY, v);
        }
        return v;
    } catch {
        return '';
    }
}

interface Props {
    articleId: string;
}

export default function ArticleFeedback({ articleId }: Props) {
    const [vote, setVote] = useState<'up' | 'down' | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Restore previous vote from localStorage so the user sees their state
    // immediately on revisit instead of being prompted again.
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const stored = localStorage.getItem(VOTE_KEY_PREFIX + articleId);
            if (stored === 'up' || stored === 'down') setVote(stored);
        } catch {
            // ignore
        }
    }, [articleId]);

    async function submit(helpful: boolean) {
        if (submitting) return;
        setSubmitting(true);
        const visitor_id = getOrCreateVisitorId();
        try {
            const res = await fetch('/api/article-feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ article_id: articleId, helpful, visitor_id }),
            });
            if (!res.ok) throw new Error('Vote failed');
            const newVote = helpful ? 'up' : 'down';
            setVote(newVote);
            try { localStorage.setItem(VOTE_KEY_PREFIX + articleId, newVote); } catch { /* noop */ }
            toast.success(helpful ? 'شكراً على رأيك!' : 'شكراً — سنحاول تحسين هذا المقال.');
        } catch {
            toast.error('تعذّر إرسال رأيك. حاول لاحقاً.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="mt-10 mb-6 mx-auto max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 sm:p-6 shadow-sm">
            {vote === null ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h4 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                            هل كان هذا المقال مفيداً لك؟
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            رأيك يساعدنا على تحسين الدليل.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => submit(true)}
                            disabled={submitting}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold transition disabled:opacity-50"
                            aria-label="مفيد"
                        >
                            <ThumbsUp size={18} /> نعم
                        </button>
                        <button
                            type="button"
                            onClick={() => submit(false)}
                            disabled={submitting}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/40 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold transition disabled:opacity-50"
                            aria-label="غير مفيد"
                        >
                            <ThumbsDown size={18} /> لا
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                        <Check size={20} />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
                            {vote === 'up' ? 'شكراً على رأيك!' : 'شكراً — رأيك مهم لنا'}
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {vote === 'up'
                                ? 'سنواصل تحديث الدليل بمحتوى مماثل.'
                                : (<>هل تخبرنا ماذا ينقص؟ <a href="/request" className="text-emerald-600 dark:text-emerald-400 underline font-bold">قدّم اقتراحاً</a> لتحسين هذا المقال.</>)}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
