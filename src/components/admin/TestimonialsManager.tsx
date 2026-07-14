'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { adminInsert, adminDelete } from '@/lib/adminApi';
import { Trash2, Plus, Star, MessageCircle } from 'lucide-react';

export default function TestimonialsManager() {
    const [reviews, setReviews] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newReview, setNewReview] = useState({ name: '', role: '', location: '', content: '', rating: 5, is_active: true });

    // Fetch Reviews
    useEffect(() => {
        fetchReviews();
    }, []);

    async function fetchReviews() {
        if (!supabase) return;
        const { data, error } = await supabase
            .from('site_testimonials')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setReviews(data);
        setIsLoading(false);
    }

    async function handleAdd() {
        if (!newReview.name || !newReview.content) return;

        const { error } = await adminInsert('site_testimonials', newReview);
        if (!error) {
            setNewReview({ name: '', role: '', location: '', content: '', rating: 5, is_active: true });
            fetchReviews();
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('هل أنت متأكد من الحذف؟')) return;
        const { error } = await adminDelete('site_testimonials', id);
        if (!error) fetchReviews();
    }

    const labelCls = 'text-xs font-black mb-1.5 block text-slate-700 dark:text-slate-200 uppercase tracking-wider';
    const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center gap-3 flex-wrap">
                <h2 className="text-xl font-black flex items-center gap-2 text-slate-800 dark:text-slate-100">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shadow-sm">
                        <MessageCircle size={18} />
                    </span>
                    آراء العملاء (Testimonials)
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-[11px] font-black tracking-wider uppercase">
                    <Star size={12} className="fill-current" />
                    <span className="tabular-nums" dir="ltr">{reviews.length}</span>
                </span>
            </div>

            {/* Add New — gradient surface + emerald accent stripe */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/40 dark:from-slate-900 dark:to-emerald-950/15 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-end">
                <span className="absolute top-0 right-0 h-full w-1 bg-emerald-500 opacity-70" />

                <div>
                    <label htmlFor="testimonial-name" className={labelCls}>الاسم</label>
                    <input
                        id="testimonial-name"
                        name="testimonial-name"
                        value={newReview.name}
                        onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                        className={inputCls}
                        placeholder="مثال: أحمد العلي"
                    />
                </div>
                <div>
                    <label htmlFor="testimonial-role" className={labelCls}>الصفة / الدور</label>
                    <input
                        id="testimonial-role"
                        name="testimonial-role"
                        value={newReview.role}
                        onChange={(e) => setNewReview({ ...newReview, role: e.target.value })}
                        className={inputCls}
                        placeholder="مثال: طالب دكتوراه"
                    />
                </div>
                <div>
                    <label htmlFor="testimonial-location" className={labelCls}>المكان</label>
                    <input
                        id="testimonial-location"
                        name="testimonial-location"
                        value={newReview.location}
                        onChange={(e) => setNewReview({ ...newReview, location: e.target.value })}
                        className={inputCls}
                        placeholder="مثال: إسطنبول"
                    />
                </div>
                <div>
                    <label htmlFor="testimonial-rating" className={labelCls}>التقييم (1–5)</label>
                    <input
                        id="testimonial-rating"
                        name="testimonial-rating"
                        type="number"
                        min="1"
                        max="5"
                        value={newReview.rating}
                        onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
                        className={`${inputCls} tabular-nums`}
                        dir="ltr"
                    />
                </div>

                <div className="md:col-span-3">
                    <label htmlFor="testimonial-content" className={labelCls}>نص الرأي</label>
                    <textarea
                        id="testimonial-content"
                        name="testimonial-content"
                        value={newReview.content}
                        onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                        className={`${inputCls} h-20 resize-none`}
                        placeholder="اكتب تجربة العميل هنا..."
                    />
                </div>
                <div>
                    <button
                        type="button"
                        onClick={handleAdd}
                        className="group/btn w-full h-10 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-black flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 hover:shadow-lg hover:shadow-emerald-600/40 hover:-translate-y-0.5 transition-all active:scale-95"
                    >
                        <Plus size={18} className="group-hover/btn:rotate-90 transition-transform" />
                        إضافة
                    </button>
                </div>
            </div>

            {/* List — testimonial cards w/ rating accent */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isLoading ? (
                    <p className="text-center text-slate-400 py-8 col-span-2">جاري التحميل...</p>
                ) : reviews.map((item) => (
                    <div
                        key={item.id}
                        className="group relative overflow-hidden p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-white to-amber-50/30 dark:from-slate-900 dark:to-amber-950/10 hover:shadow-md hover:-translate-y-0.5 transition-all"
                    >
                        <span className="absolute top-0 right-0 h-full w-1 bg-amber-400 opacity-70 group-hover:opacity-100 transition-opacity" />

                        <div className="flex justify-between items-start mb-2 gap-2">
                            <div>
                                <h3 className="font-black text-slate-800 dark:text-slate-100">{item.name}</h3>
                                <p className="text-xs text-slate-500 font-bold">{item.role} {item.location ? `· ${item.location}` : ''}</p>
                            </div>
                            <div className="flex gap-0.5 text-amber-500">
                                {[...Array(item.rating)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-3 leading-relaxed">
                            "{item.content}"
                        </p>

                        <div className="absolute top-4 left-4">
                            <button
                                type="button"
                                onClick={() => handleDelete(item.id)}
                                className="p-2 rounded-xl bg-red-50 dark:bg-red-900/15 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100"
                                title="حذف"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}

                {reviews.length === 0 && !isLoading && (
                    <div className="col-span-2 text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                        <MessageCircle size={36} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                        <p className="text-slate-500 dark:text-slate-400 font-bold">لا توجد آراء مضافة.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
