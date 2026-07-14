'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { adminInsert, adminUpsert, adminUpdate, adminDelete } from '@/lib/adminApi';
import { Bell, HelpCircle, Loader2, Trash2, Edit, Lock, Send, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { LATEST_UPDATES } from '@/lib/constants';
import { ImageUploader } from '@/components/admin/ui/ImageUploader';
import dynamic from 'next/dynamic';
import logger from '@/lib/logger';

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

    const fetchUpdates = useCallback(async () => {
        setLoading(true);
        if (!supabase) return;
        const { data } = await supabase.from('updates').select('*').order('date', { ascending: false });
        if (data) setUpdates(data);
        setLoading(false);
    }, []);

    useEffect(() => { fetchUpdates(); }, [fetchUpdates]);

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
            const { error } = await adminUpsert('updates', editingId ? { ...payload, id: editingId } : payload);

            if (error) {
                toast.error('فشل الحفظ: ' + error.message);
                return;
            }

            // Notify for new updates (not edits). One instant pipeline fans out
            // to bell + push + Telegram; the 30-min cron is only a safety net.
            if (!editingId && sendPush && formData.title) {
                try {
                    const res = await fetch('/api/admin/notify-now', { method: 'POST' });
                    const r = await res.json();
                    if (res.ok) {
                        const bits: string[] = [];
                        if (typeof r.pushSuccess === 'number' && r.pushSuccess > 0) bits.push(`${r.pushSuccess} جهاز`);
                        if (r.telegramSent > 0) bits.push('تلغرام');
                        toast.success(bits.length ? `تم النشر + إشعار (${bits.join(' + ')})` : 'تم النشر + إشعار');
                    } else {
                        toast.success('تم النشر');
                        toast.error('فشل إرسال الإشعار: ' + (r.error || ''));
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


        const { error } = await adminDelete('updates', id);

        if (error) {
            logger.error('❌ Delete failed:', error);
            toast.error(`فشل الحذف: ${error.message}`, { id: toastId });
        } else {

            toast.success('تم الحذف بنجاح', { id: toastId });
            fetchUpdates();
        }
    }

    // Show/hide a published update without deleting it (active=false hides it
    // from visitors but keeps it editable/restorable).
    const toggleActive = async (id: string, current: boolean) => {
        const { error } = await adminUpdate('updates', { active: !current }, id);
        if (error) { toast.error('فشل التحديث: ' + error.message); return; }
        toast.success(current ? 'تم التعطيل (مخفيّ عن الزوّار)' : 'تم التفعيل');
        fetchUpdates();
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form — amber accent stripe + gradient */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white to-amber-50/40 dark:from-slate-900 dark:to-amber-950/15 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 h-fit shadow-sm">
                <span className="absolute top-0 right-0 h-full w-1 bg-amber-500 opacity-70" />

                <h3 className="font-black mb-5 flex items-center gap-2 text-slate-800 dark:text-slate-100">
                    <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${editingId ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'} shadow-sm`}>
                        <Bell size={16} />
                    </span>
                    {editingId ? 'تعديل تحديث' : 'نشر تحديث جديد'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-black mb-1.5 block text-slate-700 dark:text-slate-200 uppercase tracking-wider">العنوان</label>
                        <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all" />
                    </div>
                    <div>
                        <label className="text-xs font-black mb-1.5 block text-slate-700 dark:text-slate-200 uppercase tracking-wider">النوع</label>
                        <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as DBUpdate['type'] })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all">
                            <option value="news">خبر (News)</option>
                            <option value="alert">تنبيه (Alert)</option>
                            <option value="feature">ميزة جديدة (Feature)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-black mb-1.5 block text-slate-700 dark:text-slate-200 uppercase tracking-wider">رابط التوجيه (اختياري)</label>
                        <input type="url" placeholder="مثلاً: /article/123 أو https://example.com" value={formData.link || ''} onChange={e => setFormData({ ...formData, link: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all" dir="ltr" />
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
                        <label className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-900/10 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                            <input
                                type="checkbox"
                                checked={sendPush}
                                onChange={e => setSendPush(e.target.checked)}
                                className="w-4 h-4 rounded accent-emerald-600"
                            />
                            <Send size={16} className="text-emerald-600" />
                            <span className="text-sm font-black text-slate-700 dark:text-slate-300">إرسال إشعار push للمشتركين</span>
                        </label>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className={`group/btn w-full py-3 rounded-xl font-black text-white flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-60 disabled:hover:translate-y-0 ${
                            editingId
                                ? 'bg-gradient-to-l from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-600/30 hover:shadow-blue-600/40'
                                : sendPush
                                    ? 'bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/30 hover:shadow-emerald-600/40'
                                    : 'bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/30 hover:shadow-amber-500/40'
                        }`}
                    >
                        {submitting ? <Loader2 size={18} className="animate-spin" /> : editingId ? 'حفظ التعديل' : sendPush ? <><Send size={16} className="group-hover/btn:rotate-12 transition-transform" /> نشر وإرسال إشعار</> : 'نشر التحديث'}
                    </button>
                </form>
            </div>

            {/* List — sticky header + accent stripe + per-type chip */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white to-slate-50/40 dark:from-slate-900 dark:to-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="absolute top-0 right-0 h-full w-1 bg-slate-300 dark:bg-slate-700 opacity-70 z-10" />

                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 backdrop-blur font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 relative">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        <Bell size={14} />
                    </span>
                    سجل التحديثات
                    <span className="mr-auto inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-[10px] font-black tabular-nums" dir="ltr">
                        {updates.length}
                    </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
                    {updates.map((u) => {
                        const typeChip = u.type === 'alert'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            : u.type === 'feature'
                                ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
                        return (
                            <div key={u.id} className="group relative p-4 hover:bg-amber-50/40 dark:hover:bg-amber-950/15 flex justify-between gap-3 transition-colors">
                                <span className="absolute top-0 right-0 h-full w-0.5 bg-amber-500 opacity-0 group-hover:opacity-70 transition-opacity" />

                                <div className="flex items-start gap-3 min-w-0">
                                    {u.image && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={u.image} alt={u.title} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 shadow-sm" />
                                    )}
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider ${typeChip}`}>{u.type}</span>
                                            {!u.active && <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">معطّل</span>}
                                            <span className="text-xs text-slate-400 tabular-nums" dir="ltr">{u.date}</span>
                                        </div>
                                        <h4 className="font-black text-sm text-slate-800 dark:text-slate-100 truncate">{u.title}</h4>
                                    </div>
                                </div>
                                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    <button onClick={() => toggleActive(u.id, u.active)} className={`p-2 rounded-xl transition-all hover:scale-110 active:scale-95 ${u.active ? 'bg-emerald-50 dark:bg-emerald-900/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200'}`} title={u.active ? 'تعطيل (إخفاء عن الزوّار)' : 'تفعيل'} aria-label="تفعيل أو تعطيل">{u.active ? <Eye size={16} /> : <EyeOff size={16} />}</button>
                                    <button onClick={() => { setEditingId(u.id); setFormData(u); setSendPush(false); }} className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/15 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:scale-110 active:scale-95 transition-all" aria-label="تعديل"><Edit size={16} /></button>
                                    <button onClick={() => handleDelete(u.id, u.title)} className="p-2 rounded-xl bg-red-50 dark:bg-red-900/15 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:scale-110 active:scale-95 transition-all" title="حذف" aria-label="حذف"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        );
                    })}
                    {updates.length === 0 && (
                        <div className="text-center py-12">
                            <Bell size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">لا توجد تحديثات مضافة.</p>
                        </div>
                    )}
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

    const fetchFaqs = useCallback(async () => {
        setLoading(true);
        if (!supabase) return;
        const { data } = await supabase.from('faqs').select('*').order('created_at', { ascending: false });
        if (data) setFaqs(data);
        setLoading(false);
    }, []);

    useEffect(() => { fetchFaqs(); }, [fetchFaqs]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await adminInsert('faqs', formData);
        if (!error) {
            toast.success('تم إضافة السؤال!');
            setFormData({ category: 'general', question: '', answer: '', active: true });
            fetchFaqs();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;
        const { error } = await adminDelete('faqs', id);
        if (error) {
            logger.error('Delete FAQ Error:', error);
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
                            <button onClick={() => handleDelete(f.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="حذف"><Trash2 size={16} /></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
