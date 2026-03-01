

import PageHero from '@/components/PageHero';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'سياسة الخصوصية | دليل العرب في تركيا',
  description: 'سياسة الخصوصية وشروط الاستخدام لموقع دليل العرب والسوريين في تركيا.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <main className="flex flex-col min-h-screen">

      <PageHero title="سياسة الخصوصية" description="توضيح مبسّط لكيفية التعامل مع البيانات." />

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6 text-slate-700 dark:text-slate-200 leading-relaxed">
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-3">ملخّص</h2>
          <p>
            نهدف لتقديم معلومات وخدمات إرشادية. لا نطلب إنشاء حساب للاستخدام العادي، ولا نجمع بيانات شخصية حساسة دون حاجة.
          </p>
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-3">البيانات التي قد تُجمع</h2>
          <ul className="list-disc ps-5 space-y-2">
            <li>بيانات تواصل تُرسلها أنت طوعاً عند طلب خدمة أو التواصل.</li>
            <li>بيانات تقنية أساسية لتحسين الأداء (مثل التحليلات) إن كانت مفعّلة.</li>
            <li>قد نستخدم التخزين المحلي في المتصفح لتحسين تجربة الاستخدام (مثل تفضيلات الواجهة).</li>
          </ul>
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-3">الروابط الخارجية</h2>
          <p>
            قد يحتوي الموقع على روابط لمواقع رسمية أو خارجية. نحن غير مسؤولين عن سياسات الخصوصية الخاصة بتلك المواقع.
          </p>
        </section>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 pt-4">
          آخر تحديث لسياسة الخصوصية: مارس 2026
        </p>
      </div>
    </main>
  );
}
