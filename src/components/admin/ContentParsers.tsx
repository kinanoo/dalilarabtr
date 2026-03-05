'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Bell, HelpCircle, Loader2, Trash2, Edit, Lock, Send } from 'lucide-react';
import { toast } from 'sonner';
import { LATEST_UPDATES } from '@/lib/constants';
import { ImageUploader } from '@/components/admin/ui/ImageUploader';
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(() => import('@/components/admin/ui/RichTextEditor'), { ssr: false });
// === Types ===
type DBUpdate = {
    id: string;
    title: string;
    type: 'news' | 'alert' | 'feature';
    content: string;
    date: string;
    active: boolean;
    link?: string;
    image?: string;
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
    const [updates, setUpdates] = useState<DBUpdate[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<Partial<DBUpdate>>({ type: 'news', title: '', content: '', active: true, link: '', image: '' });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [sendPush, setSendPush] = useState(false);

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
        setSubmitting(true);

        try {
            // Preserve original date on edit, use today for new
            const date = editingId ? formData.date! : new Date().toISOString().split('T')[0];
            const payload = {
                ...formData,
                date,
                // Convert empty strings to null for optional fields
                link: formData.link?.trim() || null,
                image: formData.image?.trim() || null,
            };
            const { error } = await supabase.from('updates').upsert(editingId ? { ...payload, id: editingId } : payload);

            if (error) {
                toast.error('فشل الحفظ: ' + error.message);
                return;
            }

            // Send push notification for new updates (not edits)
            if (!editingId && sendPush && formData.title) {
                try {
                    const pushRes = await fetch('/api/admin/push', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: formData.title,
                            message: formData.content || formData.title,
                            url: formData.link || '/updates',
                        }),
                    });
                    const pushResult = await pushRes.json();
                    if (pushRes.ok) {
                        toast.success(`تم النشر + إرسال إشعار لـ ${pushResult.successCount} مشترك`);
                    } else {
                        toast.success('تم النشر');
                        toast.error('فشل إرسال الإشعار: ' + (pushResult.error || ''));
                    }
                } catch {
                    toast.success('تم النشر');
                    toast.error('فشل إرسال الإشعار');
                }
            } else {
                toast.success(editingId ? 'تم حفظ التعديل' : 'تم النشر');
            }

            setEditingId(null);
            setSendPush(false);
            setFormData({ type: 'news', title: '', content: '', active: true, link: '', image: '' });
            fetchUpdates();
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string, title?: string) => {
        const toastId = toast.loading(`جاري حذف: ${title || 'التحديث'}...`);


        const { error } = await supabase!.from('updates').delete().eq('id', id);

        if (error) {
            console.error('❌ Delete failed:', error);
            toast.error(`فشل الحذف: ${error.message}`, { id: toastId });
        } else {

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
                    <ImageUploader
                        label="صورة التحديث (اختياري)"
                        value={formData.image || undefined}
                        onChange={(url) => setFormData({ ...formData, image: url })}
                        bucket="public"
                        path="updates"
                    />
                    <div>
                        <label className="text-sm font-bold block mb-1">المحتوى</label>
                        <RichTextEditor
                            value={formData.content || ''}
                            onChange={(html) => setFormData({ ...formData, content: html })}
                            placeholder="اكتب محتوى الخبر أو التحديث..."
                            minHeight="200px"
                        />
                    </div>

                    {/* Push notification toggle — only for new updates */}
                    {!editingId && (
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <input
                                type="checkbox"
                                checked={sendPush}
                                onChange={e => setSendPush(e.target.checked)}
                                className="w-4 h-4 rounded accent-emerald-600"
                            />
                            <Send size={16} className="text-emerald-600" />
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">إرسال إشعار push للمشتركين</span>
                        </label>
                    )}

                    <button type="submit" disabled={submitting} className={`w-full py-2 rounded-lg font-bold text-white flex items-center justify-center gap-2 ${editingId ? 'bg-blue-500 hover:bg-blue-600' : sendPush ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-yellow-500 hover:bg-yellow-600'}`}>
                        {submitting ? <Loader2 size={18} className="animate-spin" /> : editingId ? 'حفظ التعديل' : sendPush ? <><Send size={16} /> نشر وإرسال إشعار</> : 'نشر التحديث'}
                    </button>
                </form>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold">سجل التحديثات</div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
                    {updates.map((u) => (
                        <div key={u.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex justify-between group">
                            <div className="flex items-start gap-3">
                                {u.image && <img src={u.image} alt={u.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${u.type === 'alert' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{u.type}</span>
                                        <span className="text-xs text-slate-400">{u.date}</span>
                                    </div>
                                    <h4 className="font-bold text-sm">{u.title}</h4>
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingId(u.id); setFormData(u); setSendPush(false); }} className="text-blue-500"><Edit size={16} /></button>
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
            toast.success('تم إضافة السؤال!');
            setFormData({ category: 'general', question: '', answer: '', active: true });
            fetchFaqs();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;
        const { error } = await supabase!.from('faqs').delete().eq('id', id);
        if (error) {
            console.error('Delete FAQ Error:', error);
            toast.error('فشل الحذف: ' + error.message);
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
