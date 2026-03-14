'use client';

import { useState } from 'react';
import { Star, X, Loader2, Send } from 'lucide-react';
import StarRating from './StarRating';

interface RatingModalProps {
    isOpen: boolean;
    onClose: () => void;
    serviceId: string;
    serviceName: string;
}

export default function RatingModal({ isOpen, onClose, serviceId, serviceName }: RatingModalProps) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [clientName, setClientName] = useState(''); // Optional
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return alert('يرجى اختيار عدد النجوم');

        setLoading(true);

        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_id: serviceId,
                    rating,
                    comment,
                    client_name: clientName || 'زائر',
                }),
            });

            if (!res.ok) {
                const result = await res.json();
                throw new Error(result.error || 'فشل الإرسال');
            }

            setSubmitted(true);
            setTimeout(() => {
                onClose();
                setSubmitted(false);
                setRating(0);
                setComment('');
                setClientName('');
            }, 2000);

        } catch (err) {
            console.error(err);
            alert('حدث خطأ أثناء الإرسال');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">

                {/* Header */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Star className="fill-amber-400 text-amber-400" size={20} />
                        تقييم الخدمة
                    </h3>
                    <button onClick={onClose} aria-label="إغلاق" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {submitted ? (
                        <div className="text-center py-8 text-emerald-600 animate-in fade-in">
                            <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                                🎉
                            </div>
                            <h4 className="font-bold text-xl mb-2">شكراً لتقييمك!</h4>
                            <p className="text-slate-500 text-sm">تم استلام تقييمك وسيساهم في تحسين الخدمة.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">

                            <div className="text-center">
                                <p className="text-sm text-slate-500 mb-2">كيف كانت تجربتك مع</p>
                                <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-4">{serviceName}</h4>
                                <div className="flex justify-center scale-150 py-2">
                                    <StarRating rating={rating} size={24} interactive onChange={setRating} />
                                </div>
                                <p className="text-xs text-amber-500 mt-2 h-4 font-bold">{rating > 0 ? (rating === 5 ? 'ممتاز 😍' : rating === 1 ? 'سيء جداً 😡' : 'جيد') : ''}</p>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">اسمك (اختياري)</label>
                                    <input
                                        id="rating-client-name"
                                        name="client_name"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="فاعل خير"
                                        value={clientName}
                                        onChange={e => setClientName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">تعليقك (اختياري)</label>
                                    <textarea
                                        id="rating-comment"
                                        name="comment"
                                        rows={3}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="اكتب ملاحظاتك هنا..."
                                        value={comment}
                                        onChange={e => setComment(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                disabled={loading || rating === 0}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                                إرسال التقييم
                            </button>
                        </form>
                    )}
                </div>

            </div>
        </div>
    );
}
