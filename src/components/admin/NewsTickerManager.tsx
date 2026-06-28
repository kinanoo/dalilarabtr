'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Trash2, Plus, CheckCircle, XCircle, Newspaper } from 'lucide-react';
import { toast } from 'sonner';
import logger from '@/lib/logger';

interface TickerItem {
    id: string;
    text: string;
    link: string | null;
    is_active: boolean;
    priority: number;
    created_at: string;
}

export default function NewsTickerManager() {
    const [items, setItems] = useState<TickerItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newItem, setNewItem] = useState({ text: '', link: '', is_active: true });

    useEffect(() => {
        fetchItems();
    }, []);

    async function fetchItems() {
        if (!supabase) return;
        const { data } = await supabase
            .from('news_ticker')
            .select('*')
            .order('priority', { ascending: true });

        if (data) setItems(data);
        setIsLoading(false);
    }

    async function handleAdd() {
        if (!newItem.text.trim()) {
            toast.error('يرجى كتابة نص الخبر');
            return;
        }
        if (!supabase) return;

        const maxPriority = items.length > 0 ? Math.max(...items.map(i => i.priority)) : 0;

        const { error } = await supabase.from('news_ticker').insert([{
            text: newItem.text.trim(),
            link: newItem.link.trim() || null,
            is_active: newItem.is_active,
            priority: maxPriority + 1,
        }]);

        if (!error) {
            toast.success('تم إضافة الخبر بنجاح');
            setNewItem({ text: '', link: '', is_active: true });
            fetchItems();
        } else {
            logger.error('Insert error:', error);
            toast.error('فشل إضافة الخبر، حاول مجدداً');
        }
    }

    async function toggleActive(id: string, currentState: boolean) {
        if (!supabase) return;
        const { error } = await supabase
            .from('news_ticker')
            .update({ is_active: !currentState })
            .eq('id', id);

        if (!error) {
            fetchItems();
            toast.success(currentState ? 'تم تعطيل الخبر' : 'تم تفعيل الخبر');
        }
    }

    async function handleDelete(id: string) {
        if (!supabase) return;
        if (!confirm('هل أنت متأكد من حذف هذا الخبر من الشريط؟ لا يمكن التراجع.')) return;
        const toastId = toast.loading('جاري الحذف...');
        const { error } = await supabase.from('news_ticker').delete().eq('id', id);

        if (!error) {
            toast.success('تم حذف الخبر', { id: toastId });
            fetchItems();
        } else {
            logger.error('Delete error:', error);
            toast.error('فشل حذف الخبر، حاول مجدداً', { id: toastId });
        }
    }

    const activeCount = items.filter(i => i.is_active).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center gap-3 flex-wrap">
                <h2 className="text-xl font-black flex items-center gap-2 text-slate-800 dark:text-slate-100">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm">
                        <Newspaper size={18} />
                    </span>
                    إدارة شريط الأخبار
                </h2>
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-[10px] font-black tracking-wider uppercase">
                        <span className="tabular-nums" dir="ltr">{activeCount}</span> نشط
                    </span>
                    <span className="text-xs text-slate-500 tabular-nums" dir="ltr">/ {items.length}</span>
                </div>
            </div>

            {/* Preview — newsroom dark strip */}
            {activeCount > 0 && (
                <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white/95 rounded-2xl p-3.5 shadow-md shadow-blue-900/30">
                    <span className="absolute top-0 right-0 h-full w-1 bg-blue-400 opacity-80" />
                    <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/30 backdrop-blur text-blue-200 rounded-full text-[10px] font-black tracking-wider uppercase">
                            <Newspaper size={10} /> LIVE
                        </span>
                        <div className="text-sm truncate flex-1 font-medium">
                            {items.filter(i => i.is_active).map(i => i.text).join(' ◆ ')}
                        </div>
                    </div>
                </div>
            )}

            {/* Add New — gradient surface + blue accent */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white to-blue-50/40 dark:from-slate-900 dark:to-blue-950/15 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl space-y-4">
                <span className="absolute top-0 right-0 h-full w-1 bg-blue-500 opacity-70" />

                <div>
                    <label className="text-xs font-black mb-1.5 block text-slate-700 dark:text-slate-200 uppercase tracking-wider">نص الخبر</label>
                    <input
                        value={newItem.text}
                        onChange={(e) => setNewItem({ ...newItem, text: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                        placeholder="مثال: خبر عاجل عن تحديث قوانين الإقامة..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div className="md:col-span-7">
                        <label className="text-xs font-black mb-1.5 block text-slate-700 dark:text-slate-200 uppercase tracking-wider">رابط (اختياري)</label>
                        <input
                            value={newItem.link}
                            onChange={(e) => setNewItem({ ...newItem, link: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                            dir="ltr"
                            placeholder="/article/slug-here أو اتركه فارغاً"
                        />
                    </div>

                    <div className="md:col-span-3">
                        <label className="text-xs font-black mb-1.5 block text-slate-700 dark:text-slate-200 uppercase tracking-wider">الحالة</label>
                        <select
                            value={newItem.is_active ? 'active' : 'inactive'}
                            onChange={(e) => setNewItem({ ...newItem, is_active: e.target.value === 'active' })}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                        >
                            <option value="active">نشط فوراً</option>
                            <option value="inactive">مسودة</option>
                        </select>
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

            {/* Items List */}
            <div className="space-y-3">
                {isLoading ? (
                    <p className="text-center text-slate-400 py-8">جاري التحميل...</p>
                ) : items.map((item) => (
                    <div
                        key={item.id}
                        className={`group relative overflow-hidden flex items-center justify-between gap-4 p-4 rounded-2xl border bg-gradient-to-br ${
                            item.is_active
                                ? 'from-white to-emerald-50/50 dark:from-slate-900 dark:to-emerald-950/20 border-emerald-300 dark:border-emerald-900/60 shadow-sm hover:shadow-md hover:shadow-emerald-500/10'
                                : 'from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-800/40 border-slate-200 dark:border-slate-700 opacity-70 hover:shadow-md'
                        } hover:-translate-y-0.5 transition-all`}
                    >
                        <span className={`absolute top-0 right-0 h-full w-1 ${item.is_active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'} opacity-70 group-hover:opacity-100 transition-opacity`} />

                        <div className="flex-1 min-w-0">
                            <p className="font-black text-slate-800 dark:text-slate-100 truncate leading-snug">
                                {item.text}
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {item.is_active && (
                                    <span className="text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-lg flex items-center gap-1 uppercase tracking-wider">
                                        <CheckCircle size={10} /> نشط
                                    </span>
                                )}
                                {item.link ? (
                                    <span className="text-[10px] font-black bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-lg truncate max-w-[180px] font-mono" dir="ltr">
                                        {item.link}
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                                        بدون رابط
                                    </span>
                                )}
                                <span className="text-[10px] text-slate-400 tabular-nums" dir="ltr">
                                    {new Date(item.created_at).toLocaleDateString('ar-EG')}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => toggleActive(item.id, item.is_active)}
                                className={`p-2 rounded-xl transition-all hover:scale-110 active:scale-95 ${
                                    item.is_active
                                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-emerald-500'
                                }`}
                                title={item.is_active ? 'تعطيل' : 'تفعيل'}
                            >
                                {item.is_active ? <CheckCircle size={20} /> : <XCircle size={20} />}
                            </button>
                            <button
                                onClick={() => handleDelete(item.id)}
                                className="p-2 rounded-xl bg-red-50 dark:bg-red-900/15 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all hover:scale-110 active:scale-95"
                                title="حذف"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                ))}

                {items.length === 0 && !isLoading && (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                        <Newspaper size={36} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                        <p className="text-slate-500 dark:text-slate-400 font-bold">لا توجد أخبار مضافة. أضف أول خبر أعلاه.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
