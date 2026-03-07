'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Trash2, Edit2, Plus, Star, MessageCircle, CheckCircle, XCircle } from 'lucide-react';

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
        if (!supabase) return;

        const { error } = await supabase.from('site_testimonials').insert([newReview]);
        if (!error) {
            setNewReview({ name: '', role: '', location: '', content: '', rating: 5, is_active: true });
            fetchReviews();
        }
    }

    async function handleDelete(id: string) {
        if (!supabase) return;
        if (!confirm('هل أنت متأكد من الحذف؟')) return;
        const { error } = await supabase.from('site_testimonials').delete().eq('id', id);
        if (!error) fetchReviews();
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <MessageCircle className="text-emerald-500" />
                    إدارة التوصيات وآراء العملاء (Testimonials)
                </h2>
            </div>

            {/* Add New */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl mb-6 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-end">
                <div>
                    <label htmlFor="testimonial-name" className="text-xs font-bold mb-1 block">الاسم</label>
                    <input
                        id="testimonial-name"
                        name="testimonial-name"
                        value={newReview.name}
                        onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                        className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                        placeholder="مثال: أحمد العلي"
                    />
                </div>
                <div>
                    <label htmlFor="testimonial-role" className="text-xs font-bold mb-1 block">الصفة/الدور</label>
                    <input
                        id="testimonial-role"
                        name="testimonial-role"
                        value={newReview.role}
                        onChange={(e) => setNewReview({ ...newReview, role: e.target.value })}
                        className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                        placeholder="مثال: طالب دكتوراه"
                    />
                </div>
                <div>
                    <label htmlFor="testimonial-location" className="text-xs font-bold mb-1 block">المكان</label>
                    <input
                        id="testimonial-location"
                        name="testimonial-location"
                        value={newReview.location}
                        onChange={(e) => setNewReview({ ...newReview, location: e.target.value })}
                        className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                        placeholder="مثال: اسطنبول"
                    />
                </div>
                <div>
                    <label htmlFor="testimonial-rating" className="text-xs font-bold mb-1 block">التقييم (1-5)</label>
                    <input
                        id="testimonial-rating"
                        name="testimonial-rating"
                        type="number"
                        min="1"
                        max="5"
                        value={newReview.rating}
                        onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
                        className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                    />
                </div>
                <div className="md:col-span-3">
                    <label htmlFor="testimonial-content" className="text-xs font-bold mb-1 block">نص الرأي</label>
                    <textarea
                        id="testimonial-content"
                        name="testimonial-content"
                        value={newReview.content}
                        onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                        className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 h-20"
                        placeholder="اكتب تجربة العميل هنا..."
                    />
                </div>
                <div>
                    <button
                        type="button"
                        onClick={handleAdd}
                        className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center justify-center gap-2"
                    >
                        <Plus size={18} /> إضافة الرأي
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isLoading ? <p>جاري التحميل...</p> : reviews.map((item) => (
                    <div key={item.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 relative">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-slate-100">{item.name}</h3>
                                <p className="text-xs text-slate-500">{item.role} - {item.location}</p>
                            </div>
                            <div className="flex gap-1 text-amber-500">
                                {[...Array(item.rating)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-3">
                            "{item.content}"
                        </p>

                        <div className="absolute top-4 left-4">
                            <button
                                type="button"
                                onClick={() => handleDelete(item.id)}
                                className="text-red-400 hover:text-red-600 transition-colors"
                                title="حذف"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
                {reviews.length === 0 && !isLoading && <p className="text-center text-slate-400 py-8 col-span-2">لا توجد آراء مضافة.</p>}
            </div>
        </div>
    );
}
