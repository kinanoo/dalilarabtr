'use client';



import { useState } from 'react';
import { getAuthClient, getClientUser } from '@/lib/supabaseClient';
import { Loader2, Save, ArrowRight, Info, AlertTriangle, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ImageUploader } from '@/components/admin/ui/ImageUploader';
import logger from '@/lib/logger';

const CATEGORIES = [
    'طبيب',
    'محامي',
    'مترجم',
    'عقارات',
    'تعليم',
    'تجميل',
    'تأمين',
    'سيارات',
    'مطاعم',
    'شحن',
    'سياحة',
    'خدمات عامة'
];

export default function AddServicePage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = getAuthClient();

    const [formData, setFormData] = useState({
        name: '',
        profession: '',
        category: 'خدمات عامة',
        city: 'إسطنبول',
        district: '',
        phone: '',
        description: '',
        image: '',
        lat: 0,
        lng: 0,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase) return;
        setLoading(true);

        const user = await getClientUser();
        if (!user) {
            toast.error('يرجى تسجيل الدخول أولاً');
            router.push('/login');
            return;
        }

        try {
            const { error } = await supabase
                .from('service_providers')
                .insert([
                    {
                        user_id: user.id,
                        name: formData.name,
                        profession: formData.profession,
                        category: formData.category,
                        city: formData.city,
                        district: formData.district,
                        phone: formData.phone,
                        description: formData.description,
                        image: formData.image,
                        lat: formData.lat || null,
                        lng: formData.lng || null,
                        status: 'pending', // Explicitly pending
                        is_verified: false,
                        active: true // It might be active but invisible due to RLS status='pending'
                    }
                ]);

            if (error) throw error;

            toast.success('تم إرسال طلبك بنجاح!', {
                description: 'سيتم مراجعة خدمتك من قبل الإدارة والموافقة عليها قريباً.',
                duration: 5000,
            });

            router.push('/dashboard');

        } catch (error) {
            const errDetails = (error instanceof Error ? error.message : JSON.stringify(error)) || 'خطأ غير معروف';
            logger.error('Error submitting service:', errDetails);
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
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-[10px] font-black tracking-wider uppercase mb-1">
                        <Sparkles size={10} />
                        خدمة جديدة
                    </span>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white">إضافة خدمة جديدة</h1>
                    <p className="text-slate-500 text-sm">أدخل بيانات خدمتك بدقة ليتمكن العملاء من الوصول إليك</p>
                </div>
            </div>

            {/* Form card — accent stripe + gradient */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/30 dark:from-slate-900 dark:to-emerald-950/15 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm">
                <span className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-emerald-500 to-teal-500 opacity-70" />

                <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100/40 dark:from-amber-900/15 dark:to-amber-900/5 border border-amber-200 dark:border-amber-900/30 rounded-xl p-4 mb-8 flex items-start gap-3">
                    <span className="absolute top-0 right-0 h-full w-1 bg-amber-500 opacity-70" />
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shrink-0 shadow-sm">
                        <AlertTriangle size={18} />
                    </span>
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                        <p className="font-black mb-1">تنبيه هام</p>
                        <p className="leading-relaxed">سيتم مراجعة طلبك من قبل فريق الإدارة قبل نشره. تأكد من صحة البيانات وأرقام التواصل.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block font-bold text-sm mb-2 text-slate-700 dark:text-slate-300">اسم مقدم الخدمة *</label>
                            <input
                                type="text"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="مثال: د. أحمد نجار"
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold"
                            />
                        </div>
                        <div>
                            <label className="block font-bold text-sm mb-2 text-slate-700 dark:text-slate-300">المسمى المهني *</label>
                            <input
                                type="text"
                                name="profession"
                                required
                                value={formData.profession}
                                onChange={handleChange}
                                placeholder="مثال: طبيب أسنان، محامي شرعي..."
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
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
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none"
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
                        <div>
                            <label className="block font-bold text-sm mb-2 text-slate-700 dark:text-slate-300">رقم التواصل (واتساب) *</label>
                            <input
                                type="tel"
                                name="phone"
                                required
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="مثال: 905551234567"
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 transition-all ltr text-left"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block font-bold text-sm mb-2 text-slate-700 dark:text-slate-300">المدينة *</label>
                            <input
                                type="text"
                                name="city"
                                required
                                value={formData.city}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block font-bold text-sm mb-2 text-slate-700 dark:text-slate-300">المنطقة (اختياري)</label>
                            <input
                                type="text"
                                name="district"
                                value={formData.district}
                                onChange={handleChange}
                                placeholder="مثال: الفاتح، أسنيورت..."
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                            />
                        </div>
                    </div>



                    {/* Image */}
                    <div>
                        <ImageUploader
                            label="صورة شخصية أو شعار"
                            value={formData.image}
                            onChange={(url) => setFormData({ ...formData, image: url })}
                            bucket="public"
                            path="services"
                        />
                        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                            <Info size={12} />
                            الصورة تزيد من ثقة العملاء بنسبة 80%
                        </p>
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="block font-bold text-sm mb-2 text-slate-700 dark:text-slate-300">نبذة عن الخدمة *</label>
                        <textarea
                            name="description"
                            required
                            rows={5}
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="اكتب هنا تفاصيل خدماتك، خبراتك، وأوقات العمل..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                        />
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="group/btn bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 text-white font-black py-3.5 px-8 rounded-xl transition-all shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} className="group-hover/btn:rotate-12 transition-transform" />}
                            إرسال الطلب
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
