'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Globe, FileText, Loader2, Trash2, Edit, Save, Plus, ExternalLink } from 'lucide-react';
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

type DBForm = {
    id: string;
    name: string;
    file_url: string; // PDF Link
    category: string;
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
        if (!supabase) return;
        const { error } = await supabase.from('official_sources').insert([formData]);
        if (!error) {
            toast.success('تمت الإضافة بنجاح');
            setFormData({ name: '', url: '', description: '', is_official: true, active: true });
            fetchSources();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('حذف؟')) return;
        if (!supabase) return;
        await supabase.from('official_sources').delete().eq('id', id);
        fetchSources();
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 h-fit">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Globe className="text-blue-500" /> إضافة مصدر رسمي</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-bold block mb-1">اسم الموقع / المصدر</label>
                        <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700" />
                    </div>
                    <div>
                        <label className="text-sm font-bold block mb-1">الرابط (URL)</label>
                        <input type="url" required value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 ltr" />
                    </div>
                    <div>
                        <label className="text-sm font-bold block mb-1">وصف قصير</label>
                        <input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700" />
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked={formData.is_official} onChange={e => setFormData({ ...formData, is_official: e.target.checked })} className="w-4 h-4 text-emerald-600" />
                        <label className="text-sm">مصدر حكومي رسمي (علامة تحقق)</label>
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold">
                        {loading ? <Loader2 className="animate-spin mx-auto" /> : 'إضافة المصدر'}
                    </button>
                </form>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold">المصادر المعتمدة</div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
                    {sources.map(s => (
                        <div key={s.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex justify-between group items-center">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                    <Globe size={18} className="text-slate-500" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-1">
                                        {s.name}
                                        {s.is_official && <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">رسمي</span>}
                                    </h4>
                                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-0.5">
                                        {s.url} <ExternalLink size={10} />
                                    </a>
                                </div>
                            </div>
                            <button onClick={() => handleDelete(s.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
