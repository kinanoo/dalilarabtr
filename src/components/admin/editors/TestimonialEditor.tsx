import React from 'react';

export const TestimonialEditor = ({ form, setForm }: any) => (
    <div className="space-y-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">اسم العميل</label>
                <input
                    value={form.name || ''}
                    onChange={(e: any) => setForm({ ...form, name: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="الاسم الكامل..."
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">التقييم (1-5)</label>
                <input
                    type="number"
                    min="1"
                    max="5"
                    value={form.rating || 5}
                    onChange={(e: any) => setForm({ ...form, rating: parseInt(e.target.value) })}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">الصفة/الدور</label>
                <input
                    value={form.role || ''}
                    onChange={(e: any) => setForm({ ...form, role: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="مثال: طالب، مقيم، مستثمر..."
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">الحالة</label>
                <select
                    value={form.is_active ? 'true' : 'false'}
                    onChange={(e: any) => setForm({ ...form, is_active: e.target.value === 'true' })}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                >
                    <option value="true">منشور (Visible)</option>
                    <option value="false">مسودة (Hidden)</option>
                </select>
            </div>
        </div>

        <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">نص الرأي</label>
            <textarea
                value={form.content || ''}
                onChange={(e: any) => setForm({ ...form, content: e.target.value })}
                className="w-full p-4 h-32 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 transition-all resize-none leading-relaxed"
                placeholder="ماذا قال العميل..."
            />
        </div>
    </div>
);
