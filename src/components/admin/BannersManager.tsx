'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Trash2, Edit2, Plus, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function BannersManager() {
    const [banners, setBanners] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newBanner, setNewBanner] = useState<{
        content: string;
        type: string;
        is_active: boolean;
        link_url?: string;
        link_text?: string;
    }>({ content: '', type: 'alert', is_active: true, link_url: '', link_text: '' });

    // Fetch Banners
    useEffect(() => {
        fetchBanners();
    }, []);

    async function fetchBanners() {
        if (!supabase) return;
        const { data, error } = await supabase
            .from('site_banners')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setBanners(data);
        setIsLoading(false);
    }

    async function handleAdd() {
        if (!newBanner.content) return;
        if (!supabase) return;

        // Deactivate all existing banners first (only one active at a time)
        if (newBanner.is_active) {
            await supabase.from('site_banners').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
        }

        const { error } = await supabase.from('site_banners').insert([newBanner]);
        if (!error) {
            toast.success('تم إضافة ونشر البنر بنجاح');
            setNewBanner({ content: '', type: 'alert', is_active: true, link_url: '', link_text: '' });
            fetchBanners();
        } else {
            toast.error('فشل الإضافة: ' + error.message);
        }
    }

    async function toggleActive(id: string, currentState: boolean) {
        if (!supabase) return;
        // بنر واحد نشط فقط لتجنب الفوضى
        if (!currentState) {
            // تعطيل جميع البنرات الأخرى أولاً
            await supabase.from('site_banners').update({ is_active: false }).neq('id', id);
        }

        const { error } = await supabase.from('site_banners').update({ is_active: !currentState }).eq('id', id);
        if (!error) {
            toast.success(!currentState ? 'تم تفعيل البنر ونشره' : 'تم تعطيل البنر');
            fetchBanners();
        } else {
            toast.error('فشل التحديث: ' + error.message);
        }
    }

    async function handleDelete(id: string) {
        if (!supabase) return;
        // if (!confirm('هل أنت متأكد من الحذف؟')) return; // Removed to unblock user

        const toastId = toast.loading('جاري مسح البنر...');
        const { error } = await supabase.from('site_banners').delete().eq('id', id);

        if (!error) {
            toast.success('تم حذف البنر بنجاح', { id: toastId });
            fetchBanners();
        } else {
            console.error('Delete error:', error);
            toast.error('فشل الحذف: ' + error.message, { id: toastId });
        }
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <AlertCircle className="text-amber-500" />
                    إدارة التنبيهات (Banners)
                </h2>
            </div>

            {/* Add New */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl mb-6 space-y-4">
                {/* Main Content */}
                <div>
                    <label className="text-xs font-bold mb-1 block">نص التنبيه</label>
                    <input
                        value={newBanner.content}
                        onChange={(e) => setNewBanner({ ...newBanner, content: e.target.value })}
                        className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                        placeholder="مثال: تحديث عاجل بخصوص الإقامات..."
                    />
                </div>

                {/* Details Row */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-3">
                        <label className="text-xs font-bold mb-1 block">النوع</label>
                        <select
                            value={newBanner.type}
                            onChange={(e) => setNewBanner({ ...newBanner, type: e.target.value })}
                            className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                        >
                            <option value="alert">تنبيه أحمر (Alert)</option>
                            <option value="info">معلومة زرقاء (Info)</option>
                            <option value="warning">تحذير أصفر (Warning)</option>
                        </select>
                    </div>

                    <div className="md:col-span-4">
                        <label className="text-xs font-bold mb-1 block">رابط (اختياري)</label>
                        <input
                            value={newBanner.link_url || ''}
                            onChange={(e) => setNewBanner({ ...newBanner, link_url: e.target.value })}
                            className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 text-sm ltr"
                            placeholder="https://..."
                        />
                    </div>

                    <div className="md:col-span-3">
                        <label className="text-xs font-bold mb-1 block">نص الزر (اختياري)</label>
                        <input
                            value={newBanner.link_text || ''}
                            onChange={(e) => setNewBanner({ ...newBanner, link_text: e.target.value })}
                            className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 text-sm"
                            placeholder="اقرأ المزيد"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <button
                            onClick={handleAdd}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg font-bold flex items-center justify-center gap-2 h-[42px]"
                        >
                            <Plus size={18} /> إضافة
                        </button>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="space-y-3">
                {isLoading ? <p>جاري التحميل...</p> : banners.map((banner) => (
                    <div key={banner.id} className={`flex items-center justify-between p-4 rounded-xl border ${banner.is_active ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-slate-200 dark:border-slate-700'}`}>
                        <div className="flex-1">
                            <p className="font-bold text-slate-800 dark:text-slate-100">{banner.content}</p>
                            <div className="flex gap-2 mt-1">
                                <span className={`text-xs px-2 py-0.5 rounded ${banner.type === 'alert' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {banner.type}
                                </span>
                                {banner.is_active && <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded flex items-center gap-1"><CheckCircle size={10} /> مفعل حالياً</span>}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => toggleActive(banner.id, banner.is_active)}
                                className={`p-2 rounded-lg transition-colors ${banner.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 hover:text-emerald-500'}`}
                                title="تفعيل/تعطيل"
                            >
                                {banner.is_active ? <CheckCircle size={20} /> : <XCircle size={20} />}
                            </button>
                            <button
                                onClick={() => handleDelete(banner.id)}
                                className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                                title="حذف"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                ))}
                {banners.length === 0 && !isLoading && <p className="text-center text-slate-400 py-8">لا توجد تنبيهات مضافة.</p>}
            </div>
        </div>
    );
}
