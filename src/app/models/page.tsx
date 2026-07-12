import type { Metadata } from 'next';
import Link from 'next/link';
import { LockKeyhole } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'موديلس',
  robots: { index: false, follow: false },
};

export default function ModelsIndexPage() {
  return (
    <main dir="rtl" className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-8 shadow-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
          <LockKeyhole size={26} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">صفحة خاصة</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
          هذه الصفحة لا تعرض محتوى عاماً. افتح الرابط الخاص الذي وصل إليك من المصدر.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white hover:bg-emerald-700"
        >
          العودة للرئيسية
        </Link>
      </div>
    </main>
  );
}

