'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { adminInsert, adminDelete } from '@/lib/adminApi';
import { Globe, Loader2, Trash2, Plus, ExternalLink, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

// === Types ===
type DBSource = {
    id: string;
    name: string;
    url: string;
    description: string;
    is_official: boolean;
    active: boolean;
};

export function SourcesManager() {
    const [sources, setSources] = useState<DBSource[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<Partial<DBSource>>({ name: '', url: '', description: '', is_official: true, active: true });

    const fetchSources = async () => {
        setLoading(true);
        if (!supabase) return;
        const { data } = await supabase.from('official_sources').select('*').order('created_at', { ascending: false });
        if (data) setSources(data);
        setLoading(false);
    };

    useEffect(() => { fetchSources(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await adminInsert('official_sources', formData);
        if (!error) {
            toast.success('تمت الإضافة بنجاح');
            setFormData({ name: '', url: '', description: '', is_official: true, active: true });
            fetchSources();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('حذف؟')) return;
        const { error } = await adminDelete('official_sources', id);
        if (error) { toast.error('فشل الحذف: ' + error.message); return; }
        toast.success('تم حذف المصدر');
        fetchSources();
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form — blue accent stripe + gradient */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white to-blue-50/40 dark:from-slate-900 dark:to-blue-950/15 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 h-fit">
                <span className="absolute top-0 right-0 h-full w-1 bg-blue-500 opacity-70" />

                <h3 className="font-black mb-5 flex items-center gap-2 text-slate-800 dark:text-slate-100">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm">
                        <Plus size={18} />
                    </span>
                    إضافة مصدر رسمي
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-black block mb-1.5 text-slate-700 dark:text-slate-200 uppercase tracking-wider">اسم الموقع / المصدر</label>
                        <input
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-black block mb-1.5 text-slate-700 dark:text-slate-200 uppercase tracking-wider">الرابط (URL)</label>
                        <input
                            type="url"
                            required
                            dir="ltr"
                            value={formData.url}
                            onChange={e => setFormData({ ...formData, url: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-black block mb-1.5 text-slate-700 dark:text-slate-200 uppercase tracking-wider">وصف قصير</label>
                        <input
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                        />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={formData.is_official}
                            onChange={e => setFormData({ ...formData, is_official: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded accent-blue-600"
                        />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 transition-colors">
                            مصدر حكومي رسمي (علامة تحقق)
                        </span>
                    </label>
                    <button
                        type="submit"
                        disabled={loading}
                        className="group/btn w-full py-3 bg-gradient-to-l from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-black shadow-md shadow-blue-600/30 hover:shadow-lg hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                            <>
                                <Plus size={18} className="group-hover/btn:rotate-90 transition-transform" />
                                إضافة المصدر
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* List — blue accent stripe + hover-lift items */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white to-slate-50/40 dark:from-slate-900 dark:to-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="absolute top-0 right-0 h-full w-1 bg-slate-300 dark:bg-slate-700 opacity-70 z-10" />

                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 backdrop-blur font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 relative">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        <ShieldCheck size={14} />
                    </span>
                    المصادر المعتمدة
                    <span className="mr-auto inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-[10px] font-black tabular-nums" dir="ltr">
                        {sources.length}
                    </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
                    {sources.map(s => (
                        <div key={s.id} className="group relative p-4 hover:bg-blue-50/40 dark:hover:bg-blue-950/15 flex justify-between items-center gap-3 transition-colors">
                            <span className="absolute top-0 right-0 h-full w-0.5 bg-blue-500 opacity-0 group-hover:opacity-70 transition-opacity" />
                            <div className="flex items-start gap-3 min-w-0">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl shrink-0 group-hover:rotate-3 transition-transform shadow-sm">
                                    <Globe size={18} />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-black text-sm text-slate-800 dark:text-white flex items-center gap-1.5 flex-wrap">
                                        {s.name}
                                        {s.is_official && (
                                            <span className="text-[9px] font-black bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                رسمي
                                            </span>
                                        )}
                                    </h4>
                                    <a
                                        href={s.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-1 font-mono truncate"
                                        dir="ltr"
                                    >
                                        {s.url}
                                        <ExternalLink size={10} />
                                    </a>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(s.id)}
                                className="p-2 rounded-xl bg-red-50 dark:bg-red-900/15 text-red-500 dark:text-red-400 opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 transition-all shrink-0"
                                title="حذف"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    {sources.length === 0 && !loading && (
                        <div className="text-center py-12">
                            <Globe size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">لا توجد مصادر مضافة.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
