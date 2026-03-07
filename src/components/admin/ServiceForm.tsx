'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Upload, Plus, Save, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function ServiceForm() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        profession: '',
        category: 'other',
        city: 'Istanbul',
        district: '',
        phone: '',
        description: '',
    });

    const [imageFile, setImageFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            let imageUrl = null;

            // 1. Upload Image (if exists)
            if (imageFile) {
                if (!supabase) throw new Error('Supabase client not initialized');

                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const { error: uploadError, data } = await supabase.storage
                    .from('providers')
                    .upload(fileName, imageFile);

                if (uploadError) throw uploadError;

                // Get Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('providers')
                    .getPublicUrl(fileName);

                imageUrl = publicUrl;
            }

            // 2. Insert Data
            if (!supabase) throw new Error('Supabase client not initialized');

            const { error: insertError } = await supabase
                .from('service_providers')
                .insert([
                    {
                        ...formData,
                        image: imageUrl,
                        rating: 5.0, // Default start
                        review_count: 0,
                        is_verified: true // Admin added = Verified
                    }
                ]);

            if (insertError) throw insertError;

            setSuccess('تمت إضافة الكرت بنجاح! ✅');
            // Reset Form
            setFormData({
                name: '',
                profession: '',
                category: 'other',
                city: 'Istanbul',
                district: '',
                phone: '',
                description: '',
            });
            setImageFile(null);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'حدث خطأ غير متوقع');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">

            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <Plus className="text-emerald-500" />
                إضافة مزود خدمة جديد (قاعدة البيانات)
            </h2>

            {success && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 flex items-center gap-2">
                    <CheckCircle size={20} />
                    {success}
                </div>
            )}

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
                    <XCircle size={20} />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

                {/* Main Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="service-name" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">الاسم (أو اسم المحل)</label>
                        <input
                            required
                            id="service-name"
                            name="service-name"
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="مثال: مطعم الشام"
                        />
                    </div>
                    <div>
                        <label htmlFor="service-profession" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">المهنة / التخصص</label>
                        <input
                            required
                            id="service-profession"
                            name="service-profession"
                            type="text"
                            value={formData.profession}
                            onChange={e => setFormData({ ...formData, profession: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="مثال: مأكولات شرقية"
                        />
                    </div>
                </div>

                {/* Location & Contact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="service-city" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">المدينة</label>
                        <select
                            id="service-city"
                            name="service-city"
                            value={formData.city}
                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        >
                            <option value="Istanbul">Istanbul</option>
                            <option value="Gaziantep">Gaziantep</option>
                            <option value="Bursa">Bursa</option>
                            <option value="Ankara">Ankara</option>
                            <option value="Izmir">Izmir</option>
                            <option value="Mersin">Mersin</option>
                            <option value="Hatay">Hatay</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="service-phone" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">رقم الهاتف (واتساب)</label>
                        <input
                            required
                            id="service-phone"
                            name="service-phone"
                            type="tel"
                            dir="ltr"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none text-right"
                            placeholder="+90 5XX XXX XX XX"
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="service-description" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">وصف الخدمة</label>
                    <textarea
                        id="service-description"
                        name="service-description"
                        rows={3}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="اكتب وصفاً مختصراً للخدمات التي يقدمها..."
                    />
                </div>

                {/* Image Upload */}
                <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 transition-colors">
                    <label className="flex flex-col items-center justify-center cursor-pointer gap-2">
                        <Upload className="text-slate-400" />
                        <span className="text-sm text-slate-600 dark:text-slate-400 font-bold">
                            {imageFile ? imageFile.name : "اضغط لرفع صورة الكرت (اختياري)"}
                        </span>
                        <input
                            id="service-image"
                            name="service-image"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => setImageFile(e.target.files?.[0] || null)}
                        />
                    </label>
                </div>

                {/* Submit Button */}
                <button
                    disabled={loading}
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                    حفظ الخدمة
                </button>

            </form>
        </div>
    );
}
