import React from 'react';

export const BannerEditor = ({ form, setForm }: any) => (
    <div className="space-y-6 max-w-4xl mx-auto">
        <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">نص التنبيه</label>
            <input
                required
                value={form.content || ''}
                onChange={(e: any) => setForm({ ...form, content: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                placeholder="أدخل نص التنبيه هنا..."
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">النوع</label>
                <select
                    value={form.type || 'alert'}
                    onChange={(e: any) => setForm({ ...form, type: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                >
                    <option value="alert">تنبيه أحمر (Alert)</option>
                    <option value="info">معلومة زرقاء (Info)</option>
                    <option value="warning">تحذير أصفر (Warning)</option>
                    <option value="success">نجاح أخضر (Success)</option>
                </select>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">الحالة</label>
                <select
                    value={form.is_active ? 'true' : 'false'}
                    onChange={(e: any) => setForm({ ...form, is_active: e.target.value === 'true' })}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                >
                    <option value="true">مفعل (نشط)</option>
                    <option value="false">معطل</option>
                </select>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">رابط الزر (اختياري)</label>
                <input
                    value={form.link_url || ''}
                    onChange={(e: any) => setForm({ ...form, link_url: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 transition-all text-left"
                    placeholder="/article/123"
                    dir="ltr"
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">نص الزر</label>
                <input
                    value={form.link_text || ''}
                    onChange={(e: any) => setForm({ ...form, link_text: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="اقرأ المزيد"
                />
            </div>
        </div>
    </div>
);
