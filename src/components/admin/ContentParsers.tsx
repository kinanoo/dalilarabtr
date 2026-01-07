'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Bell, HelpCircle, Loader2, Trash2, Edit, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { LATEST_UPDATES } from '@/lib/constants';
// === Types ===
type DBUpdate = {
    id: string;
    title: string;
    type: 'news' | 'alert' | 'feature';
    content: string;
    date: string;
    active: boolean;
    link?: string;
};

type DBFAQ = {
    id: string;
    question: string;
    answer: string;
    category: string;
    active: boolean;
};

// === Updates Manager Component ===
export function UpdatesManager() {
    // ... (State)
    const [updates, setUpdates] = useState<DBUpdate[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<Partial<DBUpdate>>({ type: 'news', title: '', content: '', active: true, link: '' });
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchUpdates = async () => {
        setLoading(true);
        if (!supabase) return;
        const { data } = await supabase.from('updates').select('*').order('date', { ascending: false });
        if (data) setUpdates(data);
        setLoading(false);
    };

    useEffect(() => { fetchUpdates(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase) return;
        const payload = { ...formData, date: new Date().toISOString().split('T')[0] };
        const { error } = await supabase.from('updates').upsert(editingId ? { ...payload, id: editingId } : payload);
        if (!error) {
            alert('تم الحفظ!');
            setEditingId(null);
            setFormData({ type: 'news', title: '', content: '', active: true, link: '' });
            fetchUpdates();
        }
    };

    const handleDelete = async (id: string, title?: string) => {
        const toastId = toast.loading(`جاري حذف: ${title || 'التحديث'}...`);
        console.log('🗑️ Attempting to delete ID:', id);

        const { error } = await supabase!.from('updates').delete().eq('id', id);

        if (error) {
            console.error('❌ Delete failed:', error);
            toast.error(`فشل الحذف: ${error.message}`, { id: toastId });
        } else {
            console.log('✅ Delete successful');
            toast.success('تم الحذف بنجاح', { id: toastId });
            fetchUpdates();
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 h-fit">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Bell className="text-yellow-500" /> {editingId ? 'تعديل تحديث' : 'نشر تحديث جديد'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-bold block mb-1">العنوان</label>
                        <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700" />
                    </div>
                    <div>
                        <label className="text-sm font-bold block mb-1">النوع</label>
                        <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })} className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700">
                            <option value="news">خبر (News)</option>
                            <option value="alert">تنبيه (Alert)</option>
                            <option value="feature">ميزة جديدة (Feature)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-bold block mb-1">رابط التوجيه (اختياري)</label>
                        <input type="url" placeholder="مثلاً: /article/123 أو https://example.com" value={formData.link || ''} onChange={e => setFormData({ ...formData, link: e.target.value })} className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700" dir="ltr" />
                    </div>
                    <div>
                        <label className="text-sm font-bold block mb-1">المحتوى</label>
                        <textarea rows={3} value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700" />
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-bold">
                        {loading ? <Loader2 className="animate-spin mx-auto" /> : 'نشر التحديث'}
                    </button>
                </form>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold">سجل التحديثات</div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
                    {updates.map((u) => (
                        <div key={u.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex justify-between group">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${u.type === 'alert' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{u.type}</span>
                                    <span className="text-xs text-slate-400">{u.date}</span>
                                </div>
                                <h4 className="font-bold text-sm">{u.title}</h4>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingId(u.id); setFormData(u); }} className="text-blue-500"><Edit size={16} /></button>
                                <button onClick={() => handleDelete(u.id, u.title)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors" title="حذف"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// === FAQ Manager Component ===
export function FAQManager() {
    const [faqs, setFaqs] = useState<DBFAQ[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<Partial<DBFAQ>>({ category: 'general', question: '', answer: '', active: true });

    const fetchFaqs = async () => {
        setLoading(true);
        if (!supabase) return;
        const { data } = await supabase.from('faqs').select('*').order('created_at', { ascending: false });
        if (data) setFaqs(data);
        setLoading(false);
    };

    useEffect(() => { fetchFaqs(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase) return;
        const { error } = await supabase.from('faqs').insert([formData]);
        if (!error) {
            alert('تم إضافة السؤال!');
            setFormData({ category: 'general', question: '', answer: '', active: true });
            fetchFaqs();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;
        const { error } = await supabase!.from('faqs').delete().eq('id', id);
        if (error) {
            console.error('Delete FAQ Error:', error);
            alert('❌ فشل الحذف: ' + error.message);
        } else {
            fetchFaqs();
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 h-fit">
                <h3 className="font-bold mb-4 flex items-center gap-2"><HelpCircle className="text-violet-500" /> إضافة سؤال شائع</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-bold block mb-1">السؤال</label>
                        <input required value={formData.question} onChange={e => setFormData({ ...formData, question: e.target.value })} className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700" />
                    </div>
                    <div>
                        <label className="text-sm font-bold block mb-1">الإجابة</label>
                        <textarea rows={3} required value={formData.answer} onChange={e => setFormData({ ...formData, answer: e.target.value })} className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700" />
                    </div>
                    <div>
                        <label className="text-sm font-bold block mb-1">التصنيف</label>
                        <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700">
                            <option value="general">عام</option>
                            <option value="legal">قانوني</option>
                            <option value="residence">إقامات</option>
                        </select>
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold">
                        {loading ? <Loader2 className="animate-spin mx-auto" /> : 'إضافة السؤال'}
                    </button>
                </form>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold">الأسئلة الشائعة</div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
                    {faqs.map(f => (
                        <div key={f.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex justify-between group">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">{f.category}</span>
                                </div>
                                <h4 className="font-bold text-sm text-slate-800 dark:text-white">س: {f.question}</h4>
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">ج: {f.answer}</p>
                            </div>
                            <button onClick={() => handleDelete(f.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
