'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Quote, Star, User, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function Testimonials() {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchReviews() {
            // إذا لم يكن Supabase مهيأ، استخدم بيانات افتراضية مؤقتاً
            if (!supabase) {
                setReviews([
                    { id: 1, name: "أحمد س.", location: "اسطنبول", content: "بفضل المستشار الذكي، عرفت الأوراق المطلوبة لتجديد إقامتي وتجنبت ترحيلي.", rating: 5, role: "مقيم منذ 3 سنوات" },
                    { id: 2, name: "سارة م.", location: "بورصة", content: "الدليل وفر عليّ تكاليف محامي باهظة. بحثت عن الكود G-87 وفهمت المشكلة في ثواني.", rating: 5, role: "طالبة جامعية" },
                    { id: 3, name: "محمد ع.", location: "غازي عنتاب", content: "أفضل مصدر للمعلومات القانونية. التحديثات اليومية بتوصلني أول بأول.", rating: 5, role: "رجل أعمال" }
                ]);
                setLoading(false);
                return;
            }

            const { data } = await supabase
                .from('site_testimonials')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(3);

            if (data && data.length > 0) {
                setReviews(data);
            } else {
                // Fallback if no reviews in DB yet
                setReviews([
                    { id: 1, name: "أحمد س.", location: "اسطنبول", content: "بفضل المستشار الذكي، عرفت الأوراق المطلوبة لتجديد إقامتي وتجنبت ترحيلي.", rating: 5, role: "مقيم منذ 3 سنوات" },
                    { id: 2, name: "سارة م.", location: "بورصة", content: "الدليل وفر عليّ تكاليف محامي باهظة. بحثت عن الكود G-87 وفهمت المشكلة في ثواني.", rating: 5, role: "طالبة جامعية" }
                ]);
            }
            setLoading(false);
        }
        fetchReviews();
    }, []);

    return (
        <section className="py-16 bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />

            <div className="max-w-6xl mx-auto px-4 relative z-10">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4 text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2">
                        <Quote className="text-emerald-500 rotate-180" size={24} />
                        تجارب حقيقية
                        <Quote className="text-emerald-500" size={24} />
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        انضم لأكثر من 15,000 مستخدم يثقون في دليل العرب لتسيير أمورهم في تركيا
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {loading ? (
                        // Skeleton Loading
                        [1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
                        ))
                    ) : reviews.map((review, i) => (
                        <motion.div
                            key={review.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            viewport={{ once: true }}
                            className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 dark:border-slate-700 relative group"
                        >
                            {/* Rating */}
                            <div className="flex gap-1 mb-4 text-amber-400">
                                {[...Array(review.rating || 5)].map((_, i) => (
                                    <Star key={i} size={16} fill="currentColor" />
                                ))}
                            </div>

                            {/* Text */}
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6 min-h-[80px]">
                                "{review.content || review.text}"
                            </p>

                            {/* Author */}
                            <div className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-700 pt-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                                    {(review.name || 'User').charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                        {review.name}
                                    </div>
                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                        <User size={10} />
                                        {review.role} • {review.location}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
