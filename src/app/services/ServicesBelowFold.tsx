import Link from 'next/link';
import { Briefcase, ChevronLeft, HelpCircle, TrendingUp } from 'lucide-react';
import DeferredAddServiceBanner from '@/components/services/DeferredAddServiceBanner';
import DeferredServiceProviderInvite from '@/components/services/DeferredServiceProviderInvite';
import { SERVICE_CATEGORIES } from '@/lib/serviceCategories';
import { catIcon } from '@/lib/serviceCategoryIcons';
import type { DirectoryPopularSearch } from '@/lib/serviceDirectory';

const FAQS = [
  { question: 'كيف أجد مقدم خدمة عربي في تركيا؟', answer: 'اكتب نوع الخدمة أو اختر المدينة والمهنة، ثم افتح بطاقة مقدم الخدمة للتواصل عبر واتساب أو الاتصال.' },
  { question: 'هل كل الخدمات في الدليل باللغة العربية؟', answer: 'يعرض الدليل مقدمي خدمات يعرّفون عن خدماتهم بالعربية أو يستهدفون الجمهور العربي في تركيا.' },
  { question: 'كيف أتحقق قبل التعامل مع مقدم الخدمة؟', answer: 'راجع التفاصيل، اسأل عن السعر والخطوات كتابة، ولا تدفع كامل المبلغ مسبقاً قبل التأكد من الخدمة والاتفاق.' },
  { question: 'هل يمكن البحث حسب المدينة والمهنة معاً؟', answer: 'نعم. اختر المدينة والمهنة من الصفحة أو افتح روابط الأدلة الجاهزة حسب المدينة والمهنة.' },
];

export default function ServicesBelowFold({
  popularSearches,
  categoryCounts,
}: {
  popularSearches: DirectoryPopularSearch[];
  categoryCounts: Record<string, number>;
}) {
  const guideLinks = popularSearches.slice(0, 24);
  return (
    <div className="bg-slate-50 dark:bg-slate-950" dir="rtl">
      <section className="mx-auto w-full max-w-screen-2xl px-4 pb-5 pt-1">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="inline-flex items-center gap-2 text-base font-black text-slate-900 dark:text-slate-100"><HelpCircle size={18} className="text-emerald-600" /> أسئلة سريعة قبل التواصل</h2>
          <p className="mt-1 text-xs font-bold leading-6 text-slate-500 dark:text-slate-400">معلومات مختصرة تساعدك تختار الخدمة وتتواصل بأمان.</p>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {FAQS.map((item) => (
              <details key={item.question} className="group rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-black text-slate-800 dark:text-slate-100"><span>{item.question}</span><ChevronLeft size={16} className="shrink-0 text-slate-400 transition group-open:-rotate-90 group-open:text-emerald-600" /></summary>
                <p className="mt-2 text-xs font-bold leading-6 text-slate-600 dark:text-slate-300">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <DeferredAddServiceBanner />
      <DeferredServiceProviderInvite />

      {guideLinks.length > 0 && (
        <section className="mx-auto w-full max-w-screen-2xl px-4 pb-4 pt-1">
          <details className="group rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <span className="min-w-0"><span className="inline-flex items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-100 sm:text-base"><TrendingUp size={18} className="text-emerald-600" /> أدلة سريعة حسب المدينة والمهنة</span><span className="mt-1 block text-xs font-bold leading-5 text-slate-500 dark:text-slate-400">روابط مرتبة مثل أطباء في إسطنبول ومترجمون في مرسين.</span></span>
              <span className="shrink-0 text-[11px] font-black text-slate-500 group-open:hidden">فتح</span>
              <span className="hidden shrink-0 text-[11px] font-black text-slate-500 group-open:inline">إخفاء</span>
            </summary>
            <div className="mt-4 flex flex-wrap gap-2">
              {guideLinks.map((item) => (
                <Link key={`${item.citySlug}-${item.categorySlug}`} href={`/services/category/${item.categorySlug}/${item.citySlug}`} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                  {item.categoryLabel} في {item.city}<span className="text-[10px] text-slate-400">{item.count}</span>
                </Link>
              ))}
            </div>
          </details>
        </section>
      )}

      <section className="mx-auto w-full max-w-screen-2xl px-4 pb-10 pt-5">
        <details className="group rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3"><span className="inline-flex items-center gap-2 text-base font-black text-slate-800 dark:text-slate-100"><Briefcase size={18} className="text-emerald-600" /> تصفّح كل المهن والخدمات</span><span className="text-xs font-black text-slate-500 group-open:hidden">فتح القائمة</span><span className="hidden text-xs font-black text-slate-500 group-open:inline">إخفاء</span></summary>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {SERVICE_CATEGORIES.map((category) => {
              const Icon = catIcon(category.slug);
              return (
                <Link key={category.slug} href={`/services/category/${category.slug}`} className="group flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3 transition hover:border-emerald-300 hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:hover:border-emerald-700">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 ring-1 ring-slate-200 transition group-hover:bg-emerald-700 group-hover:text-white dark:bg-slate-900 dark:text-emerald-300 dark:ring-slate-800"><Icon size={17} /></span>
                  <span className="min-w-0"><span className="block truncate text-[13px] font-black text-slate-800 dark:text-slate-100">{category.labelAr}</span><span className="block truncate text-[10px] font-bold text-slate-400">{categoryCounts[category.name] ? `${categoryCounts[category.name]} نتيجة` : category.blurb}</span></span>
                </Link>
              );
            })}
          </div>
        </details>
      </section>
    </div>
  );
}
