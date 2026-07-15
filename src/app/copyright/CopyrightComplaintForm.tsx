'use client';

import { FormEvent, useState } from 'react';
import { ExternalLink, Scale } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/config';

export default function CopyrightComplaintForm() {
    const [confirmed, setConfirmed] = useState(false);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const pageUrl = String(form.get('pageUrl') || '').trim();
        const ownerName = String(form.get('ownerName') || '').trim();
        const relationship = String(form.get('relationship') || '').trim();
        const details = String(form.get('details') || '').trim();
        const number = SITE_CONFIG.whatsapp.replace(/\D/g, '');
        const message = [
            'طلب مراجعة حقوق نشر أو إزالة محتوى',
            '',
            `رابط المحتوى: ${pageUrl}`,
            `الاسم: ${ownerName}`,
            `الصفة أو العلاقة بالحقوق: ${relationship}`,
            `التفاصيل: ${details}`,
            '',
            'أؤكد أن المعلومات المقدمة صحيحة بحسب علمي، وأنني صاحب الحق أو مخول بالتصرف نيابة عنه.',
        ].join('\n');

        window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    };

    const inputClass = 'h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white';

    return (
        <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
                <div>
                    <label htmlFor="copyright-name" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">الاسم</label>
                    <input id="copyright-name" name="ownerName" required maxLength={120} className={inputClass} />
                </div>
                <div>
                    <label htmlFor="copyright-relationship" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">صفتك بالنسبة للمحتوى</label>
                    <select id="copyright-relationship" name="relationship" required className={inputClass} defaultValue="">
                        <option value="" disabled>اختر الصفة</option>
                        <option value="صاحب الحقوق">صاحب الحقوق</option>
                        <option value="ممثل أو وكيل مخوّل">ممثل أو وكيل مخوّل</option>
                        <option value="صاحب المحتوى الأصلي">صاحب المحتوى الأصلي</option>
                    </select>
                </div>
            </div>

            <div>
                <label htmlFor="copyright-url" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">رابط المحتوى المطلوب مراجعته</label>
                <input id="copyright-url" name="pageUrl" type="url" required maxLength={500} dir="ltr" placeholder="https://dalilarabtr.com/..." className={`${inputClass} text-left`} />
            </div>

            <div>
                <label htmlFor="copyright-details" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">اشرح الحق أو سبب طلب الإزالة</label>
                <textarea
                    id="copyright-details"
                    name="details"
                    required
                    minLength={20}
                    maxLength={2000}
                    rows={6}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="اذكر العمل الأصلي، وما الذي تملكه من حقوق، والجزء المطلوب مراجعته..."
                />
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:bg-slate-950 dark:text-slate-300">
                <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(event) => setConfirmed(event.target.checked)}
                    required
                    className="mt-1 h-4 w-4 accent-emerald-600"
                />
                <span>أؤكد أن المعلومات صحيحة بحسب علمي وأنني صاحب الحق أو مخوّل بالتصرف نيابة عنه.</span>
            </label>

            <button
                type="submit"
                disabled={!confirmed}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <Scale className="h-5 w-5" />
                إرسال الطلب للمراجعة
                <ExternalLink className="h-4 w-4" />
            </button>
        </form>
    );
}
