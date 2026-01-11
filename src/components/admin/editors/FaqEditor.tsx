import React from 'react';

export const FaqEditor = ({ form, setForm }: any) => (
    <div className="space-y-6 max-w-4xl mx-auto">
        <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">السؤال (Question)</label>
            <input
                value={form.question || ''}
                onChange={(e: any) => setForm({ ...form, question: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                placeholder="أدخل السؤال هنا..."
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">التصنيف</label>
                <select
                    value={form.category || 'general'}
                    onChange={(e: any) => setForm({ ...form, category: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                >
                    <option value="general">عام (General)</option>
                    <option value="legal">قانوني (Legal)</option>
                    <option value="residency">إقامة (Residency)</option>
                    <option value="work">عمل (Work)</option>
                    <option value="health">صحة (Health)</option>
                </select>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">الحالة</label>
                <select
                    value={form.active ? 'true' : 'false'}
                    onChange={(e: any) => setForm({ ...form, active: e.target.value === 'true' })}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                >
                    <option value="true">منشور (Active)</option>
                    <option value="false">مسودة (Inactive)</option>
                </select>
            </div>
        </div>

        <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">الإجابة (Answer)</label>
            <textarea
                value={form.answer || ''}
                onChange={(e: any) => setForm({ ...form, answer: e.target.value })}
                className="w-full p-4 h-32 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 transition-all resize-none leading-relaxed"
                placeholder="أدخل الإجابة التفصيلية هنا..."
            />
        </div>
    </div>
);
