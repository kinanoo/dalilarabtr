'use client';

import PageHero from '@/components/PageHero';
import Link from 'next/link';

export default function ContactPage() {
  return (
    <main className="flex flex-col min-h-screen">


      <PageHero title="اتصل بنا" description="نردّ بأسرع وقت ممكن حسب ضغط الرسائل." />

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-3">طرق التواصل</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/services"
              className="inline-flex items-center justify-center rounded-xl px-6 py-3 font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              اطلب خدمة
            </Link>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-300 mt-4 leading-relaxed">
            إذا كان طلبك متعلقاً بخدمة محددة، استخدم صفحة “اطلب خدمة” لتسهيل المتابعة.
          </p>
        </section>
      </div>
</main>
  );
}
