'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ShieldAlert, Save, Loader2, Trash2, Edit, Search } from 'lucide-react';
import { toast } from 'sonner';

// Types
type DBCode = {
    code: string;
    category: string;
    title: string;
    description: string;
    severity: 'safe' | 'low' | 'medium' | 'high' | 'critical';
    active: boolean;
};

const SEVERITY_COLORS = {
    safe: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    low: 'bg-blue-100 text-blue-800 border-blue-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200',
};

const CATEGORIES = [
    'أمن وجرائم', 'منع دخول', 'غرامات', 'إداري', 'حماية دولية', 'قديم'
];

export default function CodesManager() {
    const [codes, setCodes] = useState<DBCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingCode, setEditingCode] = useState<string | null>(null);
    const [filterQuery, setFilterQuery] = useState('');

    // Form State
    const [formData, setFormData] = useState<DBCode>({
        code: '',
        category: 'أمن وجرائم',
        title: '',
        description: '',
        severity: 'medium',
        active: true,
    });

    const fetchCodes = async () => {
        setLoading(true);
        if (!supabase) return;
        const { data, error } = await supabase
            .from('security_codes')
            .select('*')
            .order('code', { ascending: true });

        if (data) setCodes(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchCodes();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase) return;

        const { error } = await supabase
            .from('security_codes')
            .upsert(formData);

        if (!error) {
            toast.success('تم الحفظ بنجاح');
            setEditingCode(null);
            fetchCodes();
            // Reset only if not editing (keep category for speed)
            setFormData({
                code: '',
                category: formData.category,
                title: '',
                description: '',
                severity: 'medium',
                active: true
            });
        } else {
            toast.error('حدث خطأ: ' + error.message);
        }
    };

    const handleEdit = (code: DBCode) => {
        setEditingCode(code.code);
        setFormData(code);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (code: string) => {
        if (!confirm(`هل أنت متأكد من حذف الكود ${code}؟`)) return;
        if (!supabase) return;
        const { error } = await supabase.from('security_codes').delete().eq('code', code);
        if (!error) fetchCodes();
    };

    const filteredCodes = codes.filter(c =>
        c.code.toLowerCase().includes(filterQuery.toLowerCase()) ||
        c.title.includes(filterQuery) ||
        c.description.includes(filterQuery)
    );

    return (
        <div className="space-y-8">

            {/* === Form Section === */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-white">
                    <ShieldAlert className="text-red-500" />
                    {editingCode ? `تعديل الكود ${editingCode}` : 'إضافة كود جديد'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-bold mb-1">الكود (G-87)</label>
                            <input
                                type="text"
                                required
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 ltr font-mono"
                                disabled={!!editingCode}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">التصنيف</label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                            >
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">درجة الخطورة</label>
                            <select
                                value={formData.severity}
                                onChange={e => setFormData({ ...formData, severity: e.target.value as DBCode['severity'] })}
                                className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                            >
                                <option value="safe">Safe (آمن)</option>
                                <option value="low">Low (منخفض)</option>
                                <option value="medium">Medium (متوسط)</option>
                                <option value="high">High (مرتفع)</option>
                                <option value="critical">Critical (خطير جداً)</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <label className="flex items-center gap-2 cursor-pointer pb-2">
                                <input
                                    type="checkbox"
                                    checked={formData.active}
                                    onChange={e => setFormData({ ...formData, active: e.target.checked })}
                                    className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="font-bold text-sm">فعال (Active)</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-1">عنوان الكود (للعرض)</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                            placeholder="مثال: تهديد الأمن العام"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-1">الشرح التفصيلي</label>
                        <textarea
                            rows={2}
                            required
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                            placeholder="شرح سبب المنع وطرق الحل..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        {editingCode && (
                            <button
                                type="button"
                                onClick={() => { setEditingCode(null); setFormData(prev => ({ ...prev, code: '', title: '' })); }}
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
                            {editingCode ? 'حفظ التعديلات' : 'إضافة الكود'}
                        </button>
                    </div>
                </form>
            </div>

            {/* === List Section === */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                    <h3 className="font-bold text-slate-700 dark:text-slate-300">أكواد المنع ({filteredCodes.length})</h3>

                    <div className="relative w-64">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="بحث في الأكواد..."
                            value={filterQuery}
                            onChange={e => setFilterQuery(e.target.value)}
                            className="w-full pl-4 pr-10 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                </div>

                {loading && codes.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 flex flex-col items-center">
                        <Loader2 className="animate-spin mb-2" />
                        جاري تحميل القائمة...
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
                        {filteredCodes.length === 0 ? (
                            <div className="p-10 text-center text-slate-400">
                                لا توجد أكواد مطابقة.
                            </div>
                        ) : (
                            filteredCodes.map(code => (
                                <div key={code.code} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-mono font-bold text-lg border ${SEVERITY_COLORS[code.severity]}`}>
                                            {code.code}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                {code.title}
                                                {!code.active && <span className="bg-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded">غير فعال</span>}
                                            </h4>
                                            <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{code.description}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(code)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" title="تعديل" aria-label="تعديل">
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(code.code)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="حذف" aria-label="حذف">
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
