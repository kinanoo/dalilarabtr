import React from 'react';

export const SourceEditor = ({ form, setForm }: any) => (
    <div className="space-y-6 max-w-4xl mx-auto">
        <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">اسم المصدر</label>
            <input
                value={form.name || ''}
                onChange={(e: any) => setForm({ ...form, name: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                placeholder="مثال: إدارة الهجرة التركية..."
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">التصنيف</label>
                <select
                    value={form.category || 'government'}
                    onChange={(e: any) => setForm({ ...form, category: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                >
                    <option value="government">حكومي (Government)</option>
                    <option value="news">إخباري (News)</option>
                    <option value="embassy">سفارة/قنصلية (Embassy)</option>
                    <option value="organization">منظمة (Organization)</option>
                    <option value="other">آخر (Other)</option>
                </select>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">الرابط الرسمي (Website)</label>
                <input
                    value={form.url || ''}
                    onChange={(e: any) => setForm({ ...form, url: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 transition-all text-left"
                    placeholder="https://..."
                    dir="ltr"
                />
            </div>
        </div>

        <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">الوصف أو ملاحظات</label>
            <textarea
                value={form.description || ''}
                onChange={(e: any) => setForm({ ...form, description: e.target.value })}
                className="w-full p-4 h-32 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 transition-all resize-none leading-relaxed"
                placeholder="نبذة عن المصدر..."
            />
        </div>
    </div>
);
