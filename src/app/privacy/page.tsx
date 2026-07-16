import type { Metadata } from 'next';
import Link from 'next/link';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import PageHero from '@/components/PageHero';
import PrivacyControls from '@/components/privacy/PrivacyControls';

// Keep this policy uncached so a privacy wording change is visible
// immediately instead of reusing an older deployment's static page.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'سياسة الخصوصية وإعداداتها',
  description: 'ملخص واضح ومختصر عن البيانات والخصوصية وإعدادات التحليلات في دليل العرب.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <PageHero
        title="سياسة الخصوصية"
        description="ملخص بسيط عن بياناتك واختياراتك داخل الموقع."
      />

      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 pb-12 pt-8 text-slate-700 dark:text-slate-200">
        <section className="border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/60 dark:bg-emerald-950/20 sm:p-6">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-50">
            <ShieldCheck size={19} className="text-emerald-700 dark:text-emerald-300" />
            الخصوصية باختصار
          </h2>
          <p className="text-sm leading-7 sm:text-[15px]">
            التصفح العام لا يطلب منك إدخال اسم أو هاتف أو وثيقة. لا نحفظ إلا المعلومات التي تختار إرسالها عند استخدام ميزة مثل الحساب أو التعليق أو الاشتراك، وبالقدر اللازم لتشغيلها وحماية الموقع.
          </p>
          <p className="mt-2 text-sm leading-7 sm:text-[15px]">
            ما تكتبه في نموذج طلب الخدمة لا يُحفظ في قاعدة الموقع؛ يفتح على جهازك لإرساله عبر واتساب فقط إذا اخترت ذلك.
          </p>
        </section>

        <PrivacyControls />

        <section className="border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-50">
            <LockKeyhole size={18} className="text-emerald-700 dark:text-emerald-300" />
            بيانات ترسلها باختيارك
          </h2>
          <p className="text-sm leading-7 sm:text-[15px]">
            نحتفظ فقط بما ترسله عند استخدام حساب أو تعليق أو سؤال أو نشرة، وللمدة اللازمة لتشغيل الميزة. لا نبيع بياناتك ولا نستخدمها لإعلانات موجهة. يمكنك طلب الاطلاع عليها أو تصحيحها أو حذفها عبر{' '}
            <Link href="/contact" className="font-bold text-emerald-700 hover:underline dark:text-emerald-400">صفحة التواصل</Link>
            ، أو إلغاء النشرة من{' '}
            <Link href="/newsletter/unsubscribe" className="font-bold text-emerald-700 hover:underline dark:text-emerald-400">صفحة الإلغاء</Link>.
            وما ترسله بعد فتح واتساب أو رابط خارجي يخضع لسياسة تلك الجهة.
          </p>
        </section>

        <p className="pt-3 text-center text-xs text-slate-400 dark:text-slate-500">
          آخر تحديث: 16 يوليو 2026.
        </p>
      </div>
    </main>
  );
}
