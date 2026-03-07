'use client';

import { useState, useRef } from 'react';
import { Star, User, Send, Loader2, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { supabase } from '@/lib/supabaseClient';
import { containsProfanity } from '@/lib/profanity-filter';

type Comment = {
    id: string;
    user_name: string | null;
    rating: number | null;
    content: string;
    created_at: string;
};

type Props = {
    pageSlug: string;
    initialComments: Comment[];
};

export default function CommentsClient({ pageSlug, initialComments }: Props) {
    const [rating, setRating] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    async function handleAction(formData: FormData) {
        setError(null);
        setSuccessMsg(null);
        setIsSubmitting(true);

        const content = formData.get('content') as string;
        const rate = Number(formData.get('rating'));
        const user_name = (formData.get('user_name') as string) || 'Anonymous';

        // 1. Validation
        if (rate === 0) {
            setError('يرجى اختيار التقييم (عدد النجوم)');
            setIsSubmitting(false);
            return;
        }
        if (!content || content.length < 3) {
            setError('يرجى كتابة تعليق مفيد');
            setIsSubmitting(false);
            return;
        }

        // 2. Profanity Check (Client Side)
        if (containsProfanity(content) || containsProfanity(user_name)) {
            setError('نأسف، التعليق يحتوي على كلمات غير لائقة.');
            setIsSubmitting(false);
            return;
        }

        if (!supabase) {
            setError('خطأ في الاتصال بقاعدة البيانات.');
            setIsSubmitting(false);
            return;
        }

        // 4. Submit to Supabase
        const { error: dbError } = await supabase
            .from('comments')
            .insert([
                {
                    page_slug: pageSlug,
                    user_name,
                    rating: rate,
                    content,
                    is_published: true
                }
            ]);

        if (dbError) {
            console.error(dbError);
            setError('حدث خطأ أثناء الإرسال. تأكد من اتصالك بالإنترنت.');
            // Ideally revert optimistic update, but keeping it simple
        } else {
            // Success — comment published immediately (profanity filter already applied)
            formRef.current?.reset();
            setRating(0);
            setSuccessMsg('تم إرسال تعليقك بنجاح!');
        }

        setIsSubmitting(false);
    }

    // Calculate Average
    const totalRating = initialComments.reduce((acc, curr) => acc + (curr.rating || 0), 0);
    const avgRating = initialComments.length ? (totalRating / initialComments.length).toFixed(1) : '0.0';

    return (
        <div className="space-y-10">
            <hr className="my-10 border-slate-100 dark:border-slate-800" />

            {/* 📊 Summary Header - Clean */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-1">
                        تجارب الأعضاء
                    </h3>
                    <p className="text-slate-500 text-sm">شاركنا رأيك ليستفيد الجميع</p>
                </div>
                <div className="flex items-baseline gap-2 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-xl">
                    <span className="text-3xl font-black text-amber-500">{avgRating}</span>
                    <span className="text-slate-400 font-bold text-sm">/ 5</span>
                    <span className="w-px h-4 bg-slate-200 mx-2"></span>
                    <span className="text-xs text-slate-500 font-bold">{initialComments.length} تقييم</span>
                </div>
            </div>

            {/* ✍️ Form - Facebook Style Rounded */}
            <form ref={formRef} action={handleAction} className="bg-transparent">
                <input type="hidden" name="page_slug" value={pageSlug} />

                <div className="flex flex-col gap-4">
                    {/* Top Row: Title + Stars (Compact) */}
                    <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">أضف تعليقك</h4>
                        <div className="flex flex-row-reverse gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className={`transition-transform hover:scale-110 p-1 ${star <= rating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
                                >
                                    <Star size={20} fill={star <= rating ? "currentColor" : "none"} />
                                </button>
                            ))}
                        </div>
                        <input type="hidden" name="rating" value={rating} />
                    </div>

                    {/* Input Block */}
                    <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 mt-1">
                            <User size={20} className="text-slate-500 dark:text-slate-400" />
                        </div>

                        <div className="flex-1 space-y-3">
                            {/* Name Field (Subtle) */}
                            <input
                                id="comment-user-name"
                                name="user_name"
                                type="text"
                                placeholder="اكتب اسمك (اختياري)..."
                                className="w-full bg-transparent border-none text-xs font-bold text-slate-500 dark:text-slate-400 px-2 outline-none focus:text-slate-800 dark:focus:text-slate-200"
                            />

                            {/* Comment Bubble Input */}
                            <div className="relative w-full">
                                <textarea
                                    id="comment-content"
                                    name="content"
                                    rows={2}
                                    placeholder="اكتب تعليقاً..."
                                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-3xl py-3 px-5 pr-14 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 resize-none leading-relaxed shadow-sm block transition-all"
                                ></textarea>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center hover:bg-emerald-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md z-10"
                                >
                                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="rotate-180 ml-0.5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mt-3 text-red-500 text-xs font-bold animate-pulse flex items-center gap-1">
                        <AlertCircle size={14} /> {error}
                    </div>
                )}
                {successMsg && (
                    <div className="mt-3 text-emerald-600 text-xs font-bold flex items-center gap-1">
                        ✓ {successMsg}
                    </div>
                )}
            </form>

            {/* 📜 List - Clean Social Style */}
            <div className="space-y-6">
                {initialComments.length === 0 ? (
                    <div className="text-center py-12 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                        <p className="text-slate-400 font-medium">كن أول من يشارك تجربته هنا</p>
                    </div>
                ) : (
                    initialComments.map((comment) => (
                        <div key={comment.id} className="group flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Avatar */}
                            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-200 font-bold shrink-0 text-sm shadow-sm mt-1">
                                {comment.user_name ? comment.user_name.charAt(0) : 'U'}
                            </div>

                            {/* Bubble Content */}
                            <div className="flex-1 max-w-[90%]">
                                <div className="bg-slate-100 dark:bg-slate-800/80 rounded-2xl rounded-tr-none px-4 py-3 shadow-sm inline-block min-w-[120px]">
                                    <div className="flex justify-between items-baseline gap-4 mb-1">
                                        <h5 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                            {comment.user_name || 'Anonymous'}
                                        </h5>
                                        <div className="flex text-amber-400">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star key={i} size={10} fill={i < (comment.rating || 0) ? "currentColor" : "none"} className={i < (comment.rating || 0) ? "" : "text-slate-300 dark:text-slate-600"} />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-line">
                                        {comment.content}
                                    </p>
                                </div>
                                <div className="mt-1 mr-2 text-xs text-slate-400 font-medium flex gap-3">
                                    <span>
                                        {isNaN(Date.parse(comment.created_at))
                                            ? 'الآن'
                                            : formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ar })}
                                    </span>
                                    <button type="button" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">إعجاب</button>
                                    <button type="button" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">رد</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
