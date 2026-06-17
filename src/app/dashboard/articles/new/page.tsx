'use client';

import { useState } from 'react';
import { getAuthClient } from '@/lib/supabaseClient';
import { Loader2, Save, ArrowRight, Info, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ImageUploader } from '@/components/admin/ui/ImageUploader';
import logger from '@/lib/logger';

const CATEGORIES = [
    'أخبار عامة',
    'قوانين جديدة',
    'فرص عمل',
    'قصص نجاح',
    'فعاليات',
    'تحذيرات',
    'أخرى'
];

export default function AddArticlePage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = getAuthClient();

    const [formData, setFormData] = useState({
        title: '',
        category: 'أخبار عامة',
        intro: '',
        details: '',
        image: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase) return;
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            toast.error('يرجى تسجيل الدخول أولاً');
            router.push('/login');
            return;
        }

        try {
            const { error } = await supabase
                .from('articles')
                .insert([
                    {
                        user_id: user.id,
                        title: formData.title,
                        category: formData.category,
                        intro: formData.intro,
                        details: formData.details,
                        image: formData.image,
                        status: 'pending',
                        is_active: false,
                        last_update: new Date().toISOString(),
                    }
                ]);

            if (error) throw error;

            toast.success('تم إرسال المقال بنجاح!', {
                description: 'سيتم مراجعة المقال من قبل الإدارة والموافقة عليه قريباً.',
                duration: 5000,
            });

            router.push('/dashboard');

        } catch (error) {
            const errDetails = (error instanceof Error ? error.message : JSON.stringify(error)) || 'خطأ غير معروف';
            logger.error('Error submitting article:', errDetails);
            toast.error('حدث خطأ أثناء الإرسال: ' + errDetails);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard" className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 hover:scale-110 transition-all">
                    <ArrowRight size={20} />
                </Link>
                <div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-[10px] font-black tracking-wider uppercase mb-1">
                        <Sparkles size={10} />
                        مقال جديد
                    </span>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white">إضافة خبر أو مقال</h1>
                    <p className="text-slate-500 text-sm">شارك المعرفة والأخبار مع مجتمع دليل العرب</p>
                </div>
            </div>

            {/* Form card — accent stripe + gradient */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-900 dark:to-blue-950/15 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm">
                <span className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-blue-500 to-blue-600 opacity-70" />

                <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100/40 dark:from-blue-900/15 dark:to-blue-900/5 border border-blue-200 dark:border-blue-900/30 rounded-xl p-4 mb-8 flex items-start gap-3">
                    <span className="absolute top-0 right-0 h-full w-1 bg-blue-500 opacity-70" />
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0 shadow-sm">
                        <Info size={18} />
                    </span>
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                        <p className="font-black mb-1">تعليمات النشر</p>
                        <p className="leading-relaxed">تأكد من مصداقية الخبر، واكتب بلغة عربية سليمة. المقالات المفيدة تزيد من نقاطك في المجتمع.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block font-bold text-sm mb-2 text-slate-700 dark:text-slate-300">عنوان المقال *</label>
                            <input
                                type="text"
                                name="title"
                                required
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="اكتب عنواناً جذاباً وواضحاً..."
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-lg"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block font-bold text-sm mb-2 text-slate-700 dark:text-slate-300">التصنيف *</label>
                            <div className="relative">
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                    <ArrowRight className="-rotate-90 scale-75" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Image */}
                    <div>
                        <ImageUploader
                            label="صورة المقال (اختياري)"
                            value={formData.image}
                            onChange={(url) => setFormData({ ...formData, image: url })}
                            bucket="public"
                            path="articles"
                        />
                    </div>

                    {/* Intro */}
                    <div>
                        <label className="block font-bold text-sm mb-2 text-slate-700 dark:text-slate-300">مقدمة مختصرة *</label>
                        <textarea
                            name="intro"
                            required
                            rows={3}
                            value={formData.intro}
                            onChange={handleChange}
                            placeholder="ملخص سريع للمقال يظهر في القائمة..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                        />
                    </div>

                    {/* Details */}
                    <div>
                        <label className="block font-bold text-sm mb-2 text-slate-700 dark:text-slate-300">تفاصيل المقال *</label>
                        <textarea
                            name="details"
                            required
                            rows={10}
                            value={formData.details}
                            onChange={handleChange}
                            placeholder="اكتب تفاصيل المقال هنا. يمكنك استخدام التنسيق البسيط..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                        />
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="group/btn bg-gradient-to-l from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-60 text-white font-black py-3.5 px-8 rounded-xl transition-all shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} className="group-hover/btn:rotate-12 transition-transform" />}
                            نشر المقال
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
