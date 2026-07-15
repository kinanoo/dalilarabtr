import type { Metadata } from 'next';
import { AlertTriangle, FileSearch, ShieldCheck } from 'lucide-react';
import CopyrightComplaintForm from './CopyrightComplaintForm';

export const metadata: Metadata = {
    title: 'حقوق النشر وطلبات إزالة المحتوى',
    description: 'إرسال شكوى حقوق نشر أو طلب مراجعة وإزالة محتوى منشور على دليل العرب.',
    alternates: { canonical: '/copyright' },
};

export default function CopyrightPage() {
    return (
        <main className="bg-slate-50 px-4 py-12 dark:bg-slate-950 sm:py-16">
            <div className="mx-auto max-w-3xl">
                <header className="mb-7">
                    <div className="mb-3 inline-flex items-center gap-2 text-sm font-black text-emerald-700 dark:text-emerald-400">
                        <ShieldCheck className="h-5 w-5" />
                        حماية الحقوق
                    </div>
                    <h1 className="text-3xl font-black text-slate-950 dark:text-white sm:text-4xl">حقوق النشر وطلبات الإزالة</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                        إذا وجدت محتوى تعتقد أنه ينتهك حقاً تملكه، أرسل رابط الصفحة والتفاصيل. نراجع الطلب والمحتوى محل الشكوى قبل اتخاذ الإجراء المناسب.
                    </p>
                </header>

                <section className="mb-6 grid gap-3 sm:grid-cols-2" aria-label="معلومات قبل الإرسال">
                    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                        <FileSearch className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">أرسل رابط الصفحة بدقة واشرح العمل الأصلي والجزء محل الاعتراض.</p>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                        <p className="text-sm leading-6 text-amber-900 dark:text-amber-200">لا ترسل وثائق شخصية حساسة قبل أن يطلبها فريق المراجعة بشكل واضح.</p>
                    </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
                    <CopyrightComplaintForm />
                </section>
            </div>
        </main>
    );
}
