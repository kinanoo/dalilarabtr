import { Suspense } from 'react';
import PageHero from '@/components/PageHero';
import RequestForm from './RequestForm';
import { SITE_CONFIG } from '@/lib/config';
import { SERVICES_LIST } from '@/lib/constants';
import { MessageCircle, ClipboardList, Send, ShieldCheck } from 'lucide-react';

// Server component — the page shell renders REAL content in the first HTML
// (services, how it works, trust notes, a no-JS WhatsApp fallback CTA).
// Previously the whole page was a client component and crawlers/no-JS users
// saw only the Suspense fallback «جاري تحميل النموذج...». The interactive
// form itself stays a client island in ./RequestForm.

const STEPS = [
  { icon: ClipboardList, title: 'اختر الخدمة واكتب طلبك', desc: 'حدّد نوع الخدمة من القائمة وأضف التفاصيل التي تريدها.' },
  { icon: Send, title: 'يفتح واتساب برسالة جاهزة', desc: 'طلبك يُرسَل إلينا مباشرة عبر واتساب — بلا تسجيل وبلا حسابات.' },
  { icon: MessageCircle, title: 'نردّ عليك بالتكلفة والخطوات', desc: 'نراجع طلبك ونعود إليك بالتفاصيل والاتفاق قبل أي بدء.' },
];

export default function RequestPage() {
  const whatsappNumber = (SITE_CONFIG.whatsapp || '').replace(/\D/g, '');

  return (
    <main className="flex flex-col min-h-screen">
      <PageHero
        title="تقديم طلب خدمة"
        description="حجز مواعيد، ترجمة محلّفة، تصديق أوراق، جلب وثائق من سوريا، وخدمات أخرى — قدّم طلبك ويصلك الرد عبر واتساب."
      />

      <div className="w-full max-w-3xl mx-auto px-4 pt-8 pb-12 relative z-10">

        {/* How it works — server-rendered */}
        <section aria-label="كيف تعمل الخدمة" className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.title} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="grid place-items-center w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300 shrink-0">
                  <s.icon size={16} />
                </span>
                <span className="text-[11px] font-black text-slate-400">الخطوة {i + 1}</span>
              </div>
              <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 leading-snug">{s.title}</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </section>

        {/* The interactive form (client island) */}
        <Suspense fallback={<div className="text-center p-10 font-bold text-slate-500">جاري تحميل النموذج...</div>}>
          <RequestForm />
        </Suspense>

        {/* No-JS / direct fallback — server-rendered, always crawlable */}
        <div className="mt-4 text-center">
          <a
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('مرحباً، أريد طلب خدمة من دليل العرب.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            <MessageCircle size={16} />
            أو راسلنا على واتساب مباشرة بدون النموذج
          </a>
        </div>

        {/* Services we handle — server-rendered */}
        <section aria-label="الخدمات المتاحة" className="mt-10">
          <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mb-3">خدمات نستقبل طلباتها</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SERVICES_LIST.map((s) => (
              <li key={s.id} className="flex items-start gap-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2.5">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">{s.title}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{s.desc}</span>
                </div>
              </li>
            ))}
            <li className="flex items-start gap-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2.5">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
              <div>
                <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">خدمة أخرى غير مذكورة؟</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">اكتبها في النموذج وسنخبرك إن كان بإمكاننا المساعدة.</span>
              </div>
            </li>
          </ul>
        </section>

        {/* Trust / legal note — server-rendered */}
        <div className="mt-8 flex items-start gap-3 bg-emerald-600/[0.06] dark:bg-emerald-400/10 border border-emerald-600/15 dark:border-emerald-400/20 rounded-2xl p-4">
          <ShieldCheck size={18} className="text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            نتفق على التكلفة والخطوات معك قبل البدء بأي معاملة، ولا نطلب أي مبلغ مسبقاً عبر النموذج.
            لا ترسل صور وثائقك الشخصية إلا بعد التواصل والاتفاق. الموقع جهة مساعدة وتوجيه وليس مكتب محاماة
            أو جهة حكومية — للتفاصيل راجع صفحة إخلاء المسؤولية.
          </p>
        </div>
      </div>
    </main>
  );
}
