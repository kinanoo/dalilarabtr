'use client';

import { useState, useEffect } from 'react';
import { Star, User, Send, Loader2, ThumbsUp } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface ReviewsProps {
    serviceId: string;
}

export default function ServiceReviews({ serviceId }: ReviewsProps) {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '', name: '' });
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    useEffect(() => {
        fetchReviews();
    }, [serviceId]);

    async function fetchReviews() {
        if (!supabase) return;
        const { data } = await supabase
            .from('service_reviews')
            .select('*')
            .eq('service_id', serviceId)
            .eq('is_approved', true)
            .order('created_at', { ascending: false });

        if (data) setReviews(data);
        setLoading(false);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!supabase || !newReview.name || !newReview.comment) return;

        setSubmitting(true);
        const { error } = await supabase.from('service_reviews').insert([{
            service_id: serviceId,
            client_name: newReview.name,
            comment: newReview.comment,
            rating: newReview.rating,
            is_approved: false // Needs approval
        }]);

        setSubmitting(false);

        if (!error) {
            setSubmitSuccess(true);
            setNewReview({ rating: 5, comment: '', name: '' });
            setShowForm(false);
        } else {
            alert('حدث خطأ، حاول مرة أخرى');
        }
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-xl flex items-center gap-2">
                    <Star className="text-amber-500 fill-amber-500" />
                    تقييمات العملاء
                    <span className="text-sm text-slate-400 font-normal">({reviews.length})</span>
                </h3>
                {!showForm && !submitSuccess && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="text-emerald-600 font-bold hover:bg-emerald-50 px-4 py-2 rounded-lg transition"
                    >
                        أضف تقييمك
                    </button>
                )}
            </div>

            {/* Success Message */}
            {submitSuccess && (
                <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-6 flex items-center gap-2">
                    <ThumbsUp size={20} />
                    شكراً لك! تم إرسال تقييمك وسيظهر بعد المراجعة.
                </div>
            )}

            {/* Review Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl mb-8 animate-in fade-in slide-in-from-top-2">
                    <h4 className="font-bold mb-4 text-sm">شارك تجربتك مع هذا الخبير</h4>

                    <div className="mb-4">
                        <label className="block text-xs font-bold mb-1">تقييمك</label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setNewReview({ ...newReview, rating: star })}
                                    className={`p-1 transition ${newReview.rating >= star ? 'text-amber-400' : 'text-slate-300'}`}
                                >
                                    <Star size={24} fill={newReview.rating >= star ? "currentColor" : "none"} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-xs font-bold mb-1">الاسم</label>
                        <input
                            required
                            className="w-full border rounded-lg p-2 text-sm"
                            placeholder="اسمك.."
                            value={newReview.name}
                            onChange={e => setNewReview({ ...newReview, name: e.target.value })}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-xs font-bold mb-1">التعليق</label>
                        <textarea
                            required
                            className="w-full border rounded-lg p-2 text-sm"
                            rows={3}
                            placeholder="كيف كانت تجربتك؟"
                            value={newReview.comment}
                            onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-emerald-700"
                        >
                            {submitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                            إرسال التقييم
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="bg-slate-200 text-slate-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-300"
                        >
                            إلغاء
                        </button>
                    </div>
                </form>
            )}

            {/* List */}
            <div className="space-y-6">
                {reviews.length === 0 ? (
                    <p className="text-center text-slate-400 py-8">لا توجد تقييمات بعد. كن أول من يقيّم!</p>
                ) : (
                    reviews.map((review) => (
                        <div key={review.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 pb-6 last:pb-0">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                                        {review.client_name.charAt(0)}
                                    </div>
                                    <span className="font-bold text-sm">{review.client_name}</span>
                                </div>
                                <div className="flex text-amber-400">
                                    {[...Array(review.rating)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                                </div>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                "{review.comment}"
                            </p>
                            <div className="text-xs text-slate-400 mt-2">
                                {new Date(review.created_at).toLocaleDateString('ar-EG')}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
