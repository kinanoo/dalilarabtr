'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Trash2, Plus, CheckCircle, XCircle, Newspaper, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

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
            console.error('Insert error:', error);
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
        const toastId = toast.loading('جاري الحذف...');
        const { error } = await supabase.from('news_ticker').delete().eq('id', id);

        if (!error) {
            toast.success('تم حذف الخبر', { id: toastId });
            fetchItems();
        } else {
            console.error('Delete error:', error);
            toast.error('فشل حذف الخبر، حاول مجدداً', { id: toastId });
        }
    }

    const activeCount = items.filter(i => i.is_active).length;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Newspaper className="text-blue-500" />
                    إدارة شريط الأخبار
                </h2>
                <span className="text-sm text-slate-500">
                    {activeCount} خبر نشط من {items.length}
                </span>
            </div>

            {/* Preview */}
            {activeCount > 0 && (
                <div className="bg-[#1a2744] text-white/90 rounded-xl p-3 mb-6 overflow-hidden">
                    <div className="flex items-center gap-3">
                        <Newspaper size={14} className="text-emerald-400 shrink-0" />
                        <div className="text-sm truncate">
                            {items.filter(i => i.is_active).map(i => i.text).join(' ◆ ')}
                        </div>
                    </div>
                </div>
            )}

            {/* Add New */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl mb-6 space-y-4">
                <div>
                    <label className="text-xs font-bold mb-1 block">نص الخبر</label>
                    <input
                        value={newItem.text}
                        onChange={(e) => setNewItem({ ...newItem, text: e.target.value })}
                        className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                        placeholder="مثال: خبر عاجل عن تحديث قوانين الإقامة..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-7">
                        <label className="text-xs font-bold mb-1 block">رابط (اختياري — اتركه فارغاً إذا مجرد خبر)</label>
                        <input
                            value={newItem.link}
                            onChange={(e) => setNewItem({ ...newItem, link: e.target.value })}
                            className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 text-sm"
                            dir="ltr"
                            placeholder="/article/slug-here أو اتركه فارغاً"
                        />
                    </div>

                    <div className="md:col-span-3">
                        <label className="text-xs font-bold mb-1 block">الحالة</label>
                        <select
                            value={newItem.is_active ? 'active' : 'inactive'}
                            onChange={(e) => setNewItem({ ...newItem, is_active: e.target.value === 'active' })}
                            className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                        >
                            <option value="active">نشط فوراً</option>
                            <option value="inactive">مسودة</option>
                        </select>
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

            {/* Items List */}
            <div className="space-y-3">
                {isLoading ? (
                    <p className="text-center text-slate-400 py-8">جاري التحميل...</p>
                ) : items.map((item) => (
                    <div
                        key={item.id}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${item.is_active
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10'
                            : 'border-slate-200 dark:border-slate-700 opacity-60'
                        }`}
                    >
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 dark:text-slate-100 truncate">
                                {item.text}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {item.is_active && (
                                    <span className="text-xs bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded flex items-center gap-1">
                                        <CheckCircle size={10} /> نشط
                                    </span>
                                )}
                                {item.link && (
                                    <span className="text-xs bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded truncate max-w-[150px] inline-block align-middle" dir="ltr">
                                        {item.link}
                                    </span>
                                )}
                                {!item.link && (
                                    <span className="text-xs bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400 px-2 py-0.5 rounded">
                                        بدون رابط
                                    </span>
                                )}
                                <span className="text-xs text-slate-400">
                                    {new Date(item.created_at).toLocaleDateString('ar-EG')}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mr-3 shrink-0">
                            <button
                                onClick={() => toggleActive(item.id, item.is_active)}
                                className={`p-2 rounded-lg transition-colors ${item.is_active
                                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'
                                    : 'bg-slate-100 text-slate-400 hover:text-emerald-500 dark:bg-slate-800'
                                }`}
                                title={item.is_active ? 'تعطيل' : 'تفعيل'}
                            >
                                {item.is_active ? <CheckCircle size={20} /> : <XCircle size={20} />}
                            </button>
                            <button
                                onClick={() => handleDelete(item.id)}
                                className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors"
                                title="حذف"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                ))}

                {items.length === 0 && !isLoading && (
                    <p className="text-center text-slate-400 py-8">لا توجد أخبار مضافة. أضف أول خبر أعلاه.</p>
                )}
            </div>
        </div>
    );
}
