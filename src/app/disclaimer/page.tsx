'use client';

import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';

export default function DisclaimerPage() {
  return (
    <main className="flex flex-col min-h-screen">

      <PageHero title="إخلاء المسؤولية" description="تنويه مهم قبل الاعتماد على المحتوى." />

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6 text-slate-700 dark:text-slate-200 leading-relaxed">
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-3">المعلومات للتعريف فقط</h2>
          <p>
            المحتوى هنا يهدف للتثقيف والتبسيط ولا يُعدّ استشارة قانونية رسمية. القوانين والإجراءات قد تتغير، وقد تختلف حسب الحالة والولاية.
          </p>
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-3">المصادر الرسمية</h2>
          <p>
            ننصح دائماً بالتحقق من التفاصيل عبر الجهات الحكومية الرسمية أو محام/مستشار مختص قبل اتخاذ أي إجراء.
          </p>
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-3">المسؤولية</h2>
          <p>
            لا نتحمل مسؤولية أي خسائر أو أضرار تنتج عن استخدام المعلومات المنشورة. استخدامك للموقع يعني قبولك بهذا التنويه.
          </p>
        </section>
      </div>

      <Footer />
    </main>
  );
}
