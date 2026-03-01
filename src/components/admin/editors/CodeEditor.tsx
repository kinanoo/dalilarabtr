import React from 'react';

export const CodeEditor = ({ form, setForm }: any) => (
    <div className="space-y-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">العنوان (الاسم المختصر)</label>
                <input
                    required
                    value={form.title || ''}
                    onChange={(e: any) => setForm({ ...form, title: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="عنوان الكود..."
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">الكود (Code)</label>
                <input
                    required
                    value={form.code || ''}
                    onChange={(e: any) => setForm({ ...form, code: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold focus:ring-2 focus:ring-emerald-500 transition-all uppercase"
                    placeholder="V-87"
                />
            </div>
        </div>

        <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">درجة الخطورة</label>
            <select
                value={form.severity || 'low'}
                onChange={(e: any) => setForm({ ...form, severity: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
            >
                <option value="low">منخفض (Low)</option>
                <option value="medium">متوسط (Medium)</option>
                <option value="high">مرتفع (High)</option>
                <option value="critical">حرج (Critical)</option>
            </select>
        </div>

        <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">الوصف</label>
            <textarea
                required
                value={form.description || ''}
                onChange={(e: any) => setForm({ ...form, description: e.target.value })}
                className="w-full p-4 h-32 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 transition-all resize-none leading-relaxed"
                placeholder="شرح الكود..."
            />
        </div>

        <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">كيف ترفع هذا الكود؟</label>
            <textarea
                value={form.how_to_remove || ''}
                onChange={(e: any) => setForm({ ...form, how_to_remove: e.target.value })}
                className="w-full p-4 h-32 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 transition-all resize-none leading-relaxed"
                placeholder="خطوات رفع الكود أو إزالة القيد..."
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">مدة الحظر</label>
                <input
                    value={form.duration || ''}
                    onChange={(e: any) => setForm({ ...form, duration: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="مثال: 5 سنوات، حتى دفع الغرامة..."
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">أكواد مرتبطة (مفصولة بفاصلة)</label>
                <input
                    value={form.related_codes_text || ''}
                    onChange={(e: any) => setForm({ ...form, related_codes_text: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="V-137, N-96, Ç-101"
                    dir="ltr"
                />
            </div>
        </div>

        <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">التصنيف (Category)</label>
            <select
                value={form.category || 'general'}
                onChange={(e: any) => setForm({ ...form, category: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
            >
                <option value="general">عام (General)</option>
                <option value="entry_ban">منع دخول (Entry Ban)</option>
                <option value="deportation">ترحيل (Deportation)</option>
                <option value="visa_violation">مخالفة فيزا (Visa Violation)</option>
                <option value="residency">إقامة (Residency)</option>
                <option value="security">أمني (Security)</option>
            </select>
        </div>
    </div>
);
