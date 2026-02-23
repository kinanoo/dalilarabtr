'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FileText, Plus, Save, Loader2, Trash2, Edit, X, List, AlertTriangle, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { normalizeId } from '@/lib/useAdminData';

// Types mimicking the SQL table
type DBArticle = {
    id: string;
    title: string;
    category: string;
    intro: string;
    details: string;
    documents: string[];
    steps: string[];
    tips: string[];
    fees: string;
    warning: string;
    source: string;
    image: string;
    active: boolean;
};

export default function ArticleManager() {
    const [articles, setArticles] = useState<DBArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<DBArticle>({
        id: '',
        title: '',
        category: 'e-Devlet',
        intro: '',
        details: '',
        documents: [],
        steps: [],
        tips: [],
        fees: '',
        warning: '',
        source: '',
        image: '',
        active: true,
    });

    // Helpers for Arrays (Steps, Tips, Docs)
    const addArrayItem = (field: 'documents' | 'steps' | 'tips') => {
        setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
    };

    const updateArrayItem = (field: 'documents' | 'steps' | 'tips', index: number, value: string) => {
        const newArray = [...formData[field]];
        newArray[index] = value;
        setFormData(prev => ({ ...prev, [field]: newArray }));
    };

    const removeArrayItem = (field: 'documents' | 'steps' | 'tips', index: number) => {
        setFormData(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
    };

    // Fetch Articles
    const fetchArticles = async () => {
        setLoading(true);
        if (!supabase) return;
        const { data, error } = await supabase
            .from('articles')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setArticles(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchArticles();
    }, []);

    // Submit Handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase) return;

        const payload = {
            ...formData,
            id: formData.id || normalizeId(formData.title), // Auto-generate ID if empty
        };

        const { error } = await supabase
            .from('articles')
            .upsert(payload);

        if (!error) {
            toast.success('تم الحفظ بنجاح');
            setEditingId(null);
            fetchArticles();
            // Reset
            setFormData({
                id: '', title: '', category: 'e-Devlet', intro: '', details: '',
                documents: [], steps: [], tips: [], fees: '', warning: '', source: '', image: '', active: true
            });
        } else {
            toast.error('حدث خطأ: ' + error.message);
        }
    };

    const handleEdit = (article: DBArticle) => {
        setEditingId(article.id);
        setFormData(article);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من الحذف؟')) return;
        const { error } = await supabase!.from('articles').delete().eq('id', id);
        if (!error) fetchArticles();
    };

    return (
        <div className="space-y-8">

            {/* === Form Section === */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-white">
                    <FileText className="text-emerald-500" />
                    {editingId ? 'تعديل مقال' : 'إضافة مقال جديد'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* ID (Auto or Custom) */}
                        <div>
                            <label className="block text-sm font-bold mb-1">المعرف (Slug)</label>
                            <input
                                type="text"
                                value={formData.id}
                                onChange={e => setFormData({ ...formData, id: e.target.value })}
                                placeholder="اتركه فارغاً للتوليد التلقائي"
                                className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 ltr"
                                disabled={!!editingId} // Don't change ID while editing
                            />
                        </div>
                        {/* Category */}
                        <div>
                            <label className="block text-sm font-bold mb-1">القسم</label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                            >
                                <option value="e-Devlet">e-Devlet</option>
                                <option value="الحياة اليومية">الحياة اليومية</option>
                                <option value="أفكار مشاريع">أفكار مشاريع</option>
                                <option value="إقامات">إقامات</option>

                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-1">عنوان المقال</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-1">المقدمة (Intro)</label>
                        <textarea
                            rows={2}
                            value={formData.intro}
                            onChange={e => setFormData({ ...formData, intro: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-1">التفاصيل (نص كامل)</label>
                        <textarea
                            rows={5}
                            value={formData.details}
                            onChange={e => setFormData({ ...formData, details: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                        />
                    </div>

                    {/* === Dynamic Lists (Steps, Docs, Tips) === */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Steps */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                            <h3 className="font-bold mb-3 flex items-center gap-2"><List size={16} /> الخطوات</h3>
                            {formData.steps.map((step, i) => (
                                <div key={i} className="flex gap-2 mb-2">
                                    <span className="bg-emerald-100 text-emerald-800 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0">{i + 1}</span>
                                    <input
                                        type="text"
                                        value={step}
                                        onChange={e => updateArrayItem('steps', i, e.target.value)}
                                        className="flex-1 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2"
                                    />
                                    <button type="button" onClick={() => removeArrayItem('steps', i)} className="text-red-400"><X size={14} /></button>
                                </div>
                            ))}
                            <button type="button" onClick={() => addArrayItem('steps')} className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-2">
                                <Plus size={14} /> إضافة خطوة
                            </button>
                        </div>

                        {/* Documents */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                            <h3 className="font-bold mb-3 flex items-center gap-2"><FileText size={16} /> الأوراق المطلوبة</h3>
                            {formData.documents.map((doc, i) => (
                                <div key={i} className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={doc}
                                        onChange={e => updateArrayItem('documents', i, e.target.value)}
                                        className="flex-1 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2"
                                    />
                                    <button type="button" onClick={() => removeArrayItem('documents', i)} className="text-red-400"><X size={14} /></button>
                                </div>
                            ))}
                            <button type="button" onClick={() => addArrayItem('documents')} className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-2">
                                <Plus size={14} /> إضافة ورقة
                            </button>
                        </div>

                        {/* Tips */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                            <h3 className="font-bold mb-3 flex items-center gap-2"><AlertTriangle size={16} /> نصائح وتحذيرات</h3>
                            {formData.tips.map((tip, i) => (
                                <div key={i} className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={tip}
                                        onChange={e => updateArrayItem('tips', i, e.target.value)}
                                        className="flex-1 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2"
                                    />
                                    <button type="button" onClick={() => removeArrayItem('tips', i)} className="text-red-400"><X size={14} /></button>
                                </div>
                            ))}
                            <button type="button" onClick={() => addArrayItem('tips')} className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-2">
                                <Plus size={14} /> إضافة نصيحة
                            </button>
                        </div>
                    </div>

                    {/* Fees & Warning & Source */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-bold mb-1">الرسوم (Fees)</label>
                            <input
                                value={formData.fees}
                                onChange={e => setFormData({ ...formData, fees: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1 text-red-500">تحذير خاص</label>
                            <input
                                value={formData.warning}
                                onChange={e => setFormData({ ...formData, warning: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">المصدر الرسمي (URL)</label>
                            <div className="relative">
                                <LinkIcon size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={formData.source}
                                    onChange={e => setFormData({ ...formData, source: e.target.value })}
                                    className="w-full pr-10 pl-4 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 ltr text-right"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-1">رابط الصورة (Image URL)</label>
                        <div className="relative">
                            <ImageIcon size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                value={formData.image}
                                onChange={e => setFormData({ ...formData, image: e.target.value })}
                                className="w-full pr-10 pl-4 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 ltr text-right"
                                placeholder="https://example.com/image.jpg"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        {editingId && (
                            <button
                                type="button"
                                onClick={() => { setEditingId(null); setFormData(prev => ({ ...prev, id: '', title: '' })); }}
                                className="px-6 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                إلغاء
                            </button>
                        )}
                        <button
                            disabled={loading}
                            type="submit"
                            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                            {editingId ? 'حفظ التعديلات' : 'نشر المقال'}
                        </button>
                    </div>

                </form>
            </div>

            {/* === List Section === */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <h3 className="font-bold text-slate-700 dark:text-slate-300">مكتبة المقالات (من قاعدة البيانات)</h3>
                </div>

                {loading && articles.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 flex flex-col items-center">
                        <Loader2 className="animate-spin mb-2" />
                        جاري تحميل المقالات...
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {articles.length === 0 ? (
                            <div className="p-10 text-center text-slate-400">
                                لا توجد مقالات في قاعدة البيانات بعد. أضف أول مقال!
                            </div>
                        ) : (
                            articles.map(article => (
                                <div key={article.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-slate-200">{article.title}</h4>
                                        <div className="flex gap-2 mt-1">
                                            <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">{article.category}</span>
                                            {article.warning && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">تحذير</span>}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(article)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" title="تعديل">
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(article.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="حذف">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
