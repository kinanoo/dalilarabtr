import React from 'react';

export const SuggestionViewer = ({ form }: any) => (
    <div className="space-y-6 max-w-4xl mx-auto p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="text-xs font-bold text-slate-500 uppercase">الاسم</label>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{form.name}</p>
            </div>
            <div>
                <label className="text-xs font-bold text-slate-500 uppercase">التاريخ</label>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{new Date(form.created_at).toLocaleString('ar-EG')}</p>
            </div>
        </div>

        <div>
            <label className="text-xs font-bold text-slate-500 uppercase">معلومات الاتصال</label>
            <p className="text-lg font-medium text-slate-800 dark:text-slate-100 font-mono" dir="ltr">{form.contact_info || 'لا يوجد'}</p>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">الرسالة</label>
            <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{form.message}</p>
        </div>

        <div className="p-4 bg-yellow-50 text-yellow-800 text-sm rounded-xl border border-yellow-200">
            ملاحظة: الاقتراحات للقراءة فقط. يمكنك حذفها بعد المراجعة.
        </div>
    </div>
);
