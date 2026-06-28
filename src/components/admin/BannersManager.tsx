'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Trash2, Plus, AlertCircle, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import logger from '@/lib/logger';

// === Type Definitions ===
interface Banner {
    id: string;
    content: string;
    type: string;
    is_active: boolean;
    link_url?: string;
    link_text?: string;
    created_at?: string;
}

export default function BannersManager() {
    const [banners, setBanners] = useState<Banner[]>([]);
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

        // Insert the new banner FIRST, then deactivate the others. This order
        // means a failure can never leave the site with ZERO active banners
        // (old one stays up if the insert fails). The previous order
        // (deactivate-all THEN insert) could blank the banner on a failed insert.
        const { data: inserted, error } = await supabase
            .from('site_banners')
            .insert([newBanner])
            .select('id')
            .single();
        if (error) {
            logger.error('Insert error:', error);
            toast.error('فشل إضافة البنر، حاول مجدداً');
            return;
        }
        if (newBanner.is_active && inserted?.id) {
            const { error: deErr } = await supabase.from('site_banners').update({ is_active: false }).neq('id', inserted.id);
            if (deErr) {
                logger.error('Deactivate-others error:', deErr);
                toast.error('نُشر البنر لكن تعذّر تعطيل البنرات الأخرى — راجعها يدوياً');
            }
        }
        toast.success('تم إضافة ونشر البنر بنجاح');
        setNewBanner({ content: '', type: 'alert', is_active: true, link_url: '', link_text: '' });
        fetchBanners();
    }

    async function toggleActive(id: string, currentState: boolean) {
        if (!supabase) return;
        // Only one active banner at a time. Flip THIS one first, then (when
        // activating) deactivate the rest — so a mid-way failure never leaves
        // zero active.
        const { error } = await supabase.from('site_banners').update({ is_active: !currentState }).eq('id', id);
        if (error) {
            logger.error('Update error:', error);
            toast.error('فشل تحديث البنر، حاول مجدداً');
            return;
        }
        if (!currentState) {
            const { error: deErr } = await supabase.from('site_banners').update({ is_active: false }).neq('id', id);
            if (deErr) {
                logger.error('Deactivate-others error:', deErr);
                toast.error('فُعّل البنر لكن تعذّر تعطيل الباقي — راجعها يدوياً');
            }
        }
        toast.success(!currentState ? 'تم تفعيل البنر ونشره' : 'تم تعطيل البنر');
        fetchBanners();
    }

    async function handleDelete(id: string) {
        if (!supabase) return;
        if (!confirm('هل أنت متأكد من حذف هذا البنر؟ لا يمكن التراجع.')) return;

        const toastId = toast.loading('جاري مسح البنر...');
        const { error } = await supabase.from('site_banners').delete().eq('id', id);

        if (!error) {
            toast.success('تم حذف البنر بنجاح', { id: toastId });
            fetchBanners();
        } else {
            logger.error('Delete error:', error);
            toast.error('فشل حذف البنر، حاول مجدداً', { id: toastId });
        }
    }

    // Helper — per-type chip style + accent stripe color, used both by the
    // banner list rows and the "Add" form preview. Keeps the colors aligned
    // with each banner's semantic role so admins can tell at a glance which
    // alert is which.
    const typeMeta = (t: string) => t === 'alert'
        ? { label: 'تنبيه', chip: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', accent: 'bg-red-500' }
        : t === 'warning'
        ? { label: 'تحذير', chip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', accent: 'bg-amber-500' }
        : { label: 'معلومة', chip: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', accent: 'bg-blue-500' };

    return (
        <div className="space-y-6">
            {/* Section header — same magazine pattern used in admin sub-pages */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="text-xl font-black flex items-center gap-2 text-slate-800 dark:text-slate-100">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shadow-sm">
                        <AlertCircle size={18} />
                    </span>
                    إدارة التنبيهات (Banners)
                </h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-[11px] font-black tracking-wider uppercase">
                    <Sparkles size={12} />
                    تنبيه واحد فعّال
                </span>
            </div>

            {/* Add New — gradient surface + amber accent stripe */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white to-amber-50/40 dark:from-slate-900 dark:to-amber-950/15 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl space-y-4">
                <span className="absolute top-0 right-0 h-full w-1 bg-amber-500 opacity-70" />

                {/* Main Content */}
                <div>
                    <label className="text-xs font-black mb-1.5 block text-slate-700 dark:text-slate-200 uppercase tracking-wider">نص التنبيه</label>
                    <input
                        value={newBanner.content}
                        onChange={(e) => setNewBanner({ ...newBanner, content: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                        placeholder="مثال: تحديث عاجل بخصوص الإقامات..."
                    />
                </div>

                {/* Details Row */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div className="md:col-span-3">
                        <label className="text-xs font-black mb-1.5 block text-slate-700 dark:text-slate-200 uppercase tracking-wider">النوع</label>
                        <select
                            value={newBanner.type}
                            onChange={(e) => setNewBanner({ ...newBanner, type: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                        >
                            <option value="alert">تنبيه أحمر (Alert)</option>
                            <option value="info">معلومة زرقاء (Info)</option>
                            <option value="warning">تحذير أصفر (Warning)</option>
                        </select>
                    </div>

                    <div className="md:col-span-4">
                        <label className="text-xs font-black mb-1.5 block text-slate-700 dark:text-slate-200 uppercase tracking-wider">رابط (اختياري)</label>
                        <input
                            value={newBanner.link_url || ''}
                            onChange={(e) => setNewBanner({ ...newBanner, link_url: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                            dir="ltr"
                            placeholder="https://..."
                        />
                    </div>

                    <div className="md:col-span-3">
                        <label className="text-xs font-black mb-1.5 block text-slate-700 dark:text-slate-200 uppercase tracking-wider">نص الزر (اختياري)</label>
                        <input
                            value={newBanner.link_text || ''}
                            onChange={(e) => setNewBanner({ ...newBanner, link_text: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                            placeholder="اقرأ المزيد"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <button
                            onClick={handleAdd}
                            className="group/btn w-full bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white p-2.5 rounded-xl font-black flex items-center justify-center gap-2 h-[42px] shadow-md shadow-emerald-600/30 hover:shadow-lg hover:shadow-emerald-600/40 hover:-translate-y-0.5 transition-all active:scale-95"
                        >
                            <Plus size={18} className="group-hover/btn:rotate-90 transition-transform" />
                            إضافة
                        </button>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="space-y-3">
                {isLoading ? (
                    <p className="text-center text-slate-400 py-8">جاري التحميل...</p>
                ) : banners.map((banner) => {
                    const meta = typeMeta(banner.type);
                    return (
                        <div
                            key={banner.id}
                            className={`group relative overflow-hidden flex items-center justify-between gap-4 p-4 rounded-2xl border bg-gradient-to-br ${
                                banner.is_active
                                    ? 'from-white to-emerald-50/50 dark:from-slate-900 dark:to-emerald-950/20 border-emerald-300 dark:border-emerald-900/60 shadow-sm hover:shadow-md hover:shadow-emerald-500/10'
                                    : 'from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-800/40 border-slate-200 dark:border-slate-700 hover:shadow-md'
                            } hover:-translate-y-0.5 transition-all`}
                        >
                            <span className={`absolute top-0 right-0 h-full w-1 ${banner.is_active ? 'bg-emerald-500' : meta.accent} opacity-70 group-hover:opacity-100 transition-opacity`} />

                            <div className="flex-1 min-w-0">
                                <p className="font-black text-slate-800 dark:text-slate-100 break-words leading-snug">{banner.content}</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider ${meta.chip}`}>
                                        {meta.label}
                                    </span>
                                    {banner.is_active && (
                                        <span className="text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-lg flex items-center gap-1 uppercase tracking-wider">
                                            <CheckCircle size={10} />
                                            مفعّل
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => toggleActive(banner.id, banner.is_active)}
                                    className={`p-2 rounded-xl transition-all hover:scale-110 active:scale-95 ${
                                        banner.is_active
                                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-emerald-500'
                                    }`}
                                    title="تفعيل/تعطيل"
                                >
                                    {banner.is_active ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                </button>
                                <button
                                    onClick={() => handleDelete(banner.id)}
                                    className="p-2 rounded-xl bg-red-50 dark:bg-red-900/15 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all hover:scale-110 active:scale-95"
                                    title="حذف"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    );
                })}
                {banners.length === 0 && !isLoading && (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                        <AlertCircle size={36} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                        <p className="text-slate-500 dark:text-slate-400 font-bold">لا توجد تنبيهات مضافة.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
