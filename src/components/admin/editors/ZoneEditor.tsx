import React from 'react';

export const ZoneEditor = ({ form, setForm }: any) => (
    <div className="space-y-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">المدينة</label>
                <input
                    value={form.city || ''}
                    onChange={(e: any) => setForm({ ...form, city: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="اسم المدينة..."
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">المنطقة (District)</label>
                <input
                    value={form.district || ''}
                    onChange={(e: any) => setForm({ ...form, district: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="اسم المنطقة..."
                />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">الحي (Neighborhood)</label>
                <input
                    value={form.neighborhood || ''}
                    onChange={(e: any) => setForm({ ...form, neighborhood: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="اسم الحي (اختياري)..."
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">الحالة</label>
                <select
                    value={form.status || 'closed'}
                    onChange={(e: any) => setForm({ ...form, status: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                >
                    <option value="closed">🔴 منطقة محظورة (Closed)</option>
                    <option value="open">🟢 منطقة مفتوحة (Open)</option>
                </select>
            </div>
        </div>

        <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">ملاحظات إضافية</label>
            <textarea
                value={form.notes || ''}
                onChange={(e: any) => setForm({ ...form, notes: e.target.value })}
                className="w-full p-4 h-32 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 transition-all resize-none leading-relaxed"
                placeholder="أي ملاحظات إضافية..."
            />
        </div>
    </div>
);
