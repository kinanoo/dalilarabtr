import { Suspense } from 'react';
import Link from 'next/link';
import PageHero from '@/components/PageHero';
import RequestForm from './RequestForm';
import { SITE_CONFIG } from '@/lib/config';
import { MessageCircle, ClipboardList, Send, ShieldCheck, Clock } from 'lucide-react';

// Server component — the page shell renders REAL content in the first HTML
// (services, how it works, trust notes, a no-JS WhatsApp fallback CTA).
// Previously the whole page was a client component and crawlers/no-JS users
// saw only the Suspense fallback «جاري تحميل النموذج...». The interactive
// form itself stays a client island in ./RequestForm.

const STEPS = [
  { icon: ClipboardList, title: 'اختر الخدمة ووضّح طلبك', desc: 'حدّد نوع الخدمة، ويرجى توضيح ما تريده بالضبط في التفاصيل ليصلك ردّ دقيق.' },
  { icon: Send, title: 'يفتح واتساب برسالة جاهزة', desc: 'طلبك يُرسَل إلينا مباشرة عبر واتساب — بلا تسجيل وبلا حسابات.' },
  { icon: MessageCircle, title: 'نردّ عليك بالتكلفة والخطوات', desc: 'نراجع طلبك ونعود إليك بالتفاصيل والاتفاق قبل البدء — عادةً خلال ساعات.' },
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

        {/* Prominent WhatsApp CTA + expected response time — server-rendered,
            works even with JavaScript disabled (a real no-JS conversion path). */}
        <div className="mt-5 flex flex-col items-center gap-2.5">
          <a
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('مرحباً، أريد طلب خدمة من دليل العرب.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base px-7 py-3.5 shadow-lg shadow-emerald-600/25 transition-colors w-full sm:w-auto"
          >
            <MessageCircle size={20} />
            راسلنا مباشرة على واتساب
          </a>
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Clock size={13} className="text-emerald-600 dark:text-emerald-400" />
            نردّ عادةً خلال ساعات — بلا تسجيل، والرسوم تُتفق عليها قبل البدء.
          </p>
        </div>

        {/* Trust / legal note — server-rendered */}
        <div className="mt-8 flex items-start gap-3 bg-emerald-600/[0.06] dark:bg-emerald-400/10 border border-emerald-600/15 dark:border-emerald-400/20 rounded-2xl p-4">
          <ShieldCheck size={18} className="text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            الخدمة والاستشارة ليست مجانية — تُطبَّق رسوم حسب نوع المعاملة يُتفق عليها معك قبل البدء،
            لكن لا نطلب أي مبلغ مسبقاً عبر النموذج.
            لا ترسل صور وثائقك الشخصية أو رقم الكملك الكامل إلا بعد التواصل والاتفاق. طلبك لا يُخزَّن
            على خوادمنا — يُرسَل مباشرةً عبر واتساب. الموقع جهة مساعدة وتوجيه وليس مكتب محاماة أو جهة
            حكومية — للتفاصيل راجع{' '}
            <Link href="/privacy" className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline">سياسة الخصوصية</Link>
            {' '}و
            <Link href="/disclaimer" className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline">إخلاء المسؤولية</Link>.
          </p>
        </div>
      </div>
    </main>
  );
}
