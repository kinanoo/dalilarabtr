'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Loader2, Save, ArrowRight, Info, AlertTriangle, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ImageUploader } from '@/components/admin/ui/ImageUploader';

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
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

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
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();

        // Dev Member Bypass Check
        if (process.env.NODE_ENV === 'development' && document.cookie.includes('dev_member_bypass=true')) {
            setTimeout(() => {
                toast.success('تم إرسال المقال بنجاح! (محاكاة وضع المطور)', {
                    description: 'تم تجاوز قاعدة البيانات لعدم وجود مستخدم حقيقي.',
                    duration: 5000,
                });
                router.push('/dashboard');
                setLoading(false);
            }, 1000);
            return;
        }

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
                        details: formData.details, // This is the full content
                        image: formData.image,
                        status: 'pending',
                        lastUpdate: new Date().toISOString(),
                    }
                ]);

            if (error) throw error;

            toast.success('تم إرسال المقال بنجاح!', {
                description: 'سيتم مراجعة المقال من قبل الإدارة والموافقة عليه قريباً.',
                duration: 5000,
            });

            router.push('/dashboard');

        } catch (error: any) {
            const errDetails = error?.message || JSON.stringify(error) || 'خطأ غير معروف';
            console.error('Error submitting article:', errDetails);
            toast.error('حدث خطأ أثناء الإرسال: ' + errDetails);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard" className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors">
                    <ArrowRight size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">إضافة خبر أو مقال</h1>
                    <p className="text-slate-500 text-sm">شارك المعرفة والأخبار مع مجتمع دليل العرب</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm">

                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 mb-8 flex items-start gap-3">
                    <Info className="text-blue-600 shrink-0 mt-0.5" size={20} />
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                        <p className="font-bold mb-1">تعليمات النشر</p>
                        <p>تأكد من مصداقية الخبر، واكتب بلغة عربية سليمة. المقالات المفيدة تزيد من نقاطك في المجتمع.</p>
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
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                            نشر المقال
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
