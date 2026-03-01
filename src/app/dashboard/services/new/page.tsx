'use client';



import { useState } from 'react';
import { getAuthClient } from '@/lib/supabaseClient';
import { Loader2, Save, ArrowRight, Info, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ImageUploader } from '@/components/admin/ui/ImageUploader';

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

        const { data: { user } } = await supabase.auth.getUser();

        // Dev Member Bypass Check
        if (process.env.NODE_ENV === 'development' && document.cookie.includes('dev_member_bypass=true')) {
            setTimeout(() => {
                toast.success('تم إرسال الخدمة بنجاح (محاكاة وضع المطور)', {
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

        } catch (error: any) {
            const errDetails = error?.message || JSON.stringify(error) || 'خطأ غير معروف';
            console.error('Error submitting service:', errDetails);
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
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">إضافة خدمة جديدة</h1>
                    <p className="text-slate-500 text-sm">أدخل بيانات خدمتك بدقة ليتمكن العملاء من الوصول إليك</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm">

                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl p-4 mb-8 flex items-start gap-3">
                    <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                        <p className="font-bold mb-1">تنبيه هام</p>
                        <p>سيتم مراجعة طلبك من قبل فريق الإدارة قبل نشره. تأكد من صحة البيانات وأرقام التواصل.</p>
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
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                            إرسال الطلب
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
