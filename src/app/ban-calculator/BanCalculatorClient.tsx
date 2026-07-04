
'use client';

import PageHero from '@/components/PageHero';
import ShareMenu from '@/components/ShareMenu';
import { SITE_CONFIG } from '@/lib/config';
import { useState } from 'react';
import { Calculator, AlertTriangle, CheckCircle, Info, Plane } from 'lucide-react';
import InlineRelatedArticles from '@/components/InlineRelatedArticles';
import CrossLinks from '@/components/seo/CrossLinks';

export default function BanCalculator() {

  const [duration, setDuration] = useState('0-3m');
  const [exitType, setExitType] = useState('voluntary');
  const [finePaid, setFinePaid] = useState('yes');
  const [result, setResult] = useState<{ text: string; color: string; desc: string } | null>(null);

  const calculateBan = () => {
    // منطق القانون التركي (V-84 / G-87)
    let banText = "";
    let banColor = "";
    let banDesc = "";

    if (exitType === 'deport') {
      banText = "منع لمدة 5 سنوات (أو أكثر)";
      banColor = "bg-red-500";
      banDesc = "الخروج عبر الترحيل (Deport) يفرض كود منع تلقائي (G-87) لمدة 5 سنوات، وقد يكون دائماً لأسباب أمنية.";
    } else if (finePaid === 'no') {
      banText = "منع لمدة 5 سنوات";
      banColor = "bg-red-500";
      banDesc = "عدم دفع الغرامة في المطار عند الخروج الطوعي قد يفرض كود منع. كود Ç-114 يُستخدم للأجانب الذين تُتخذ بحقهم إجراءات قضائية (ليس فقط مخالفات الحدود).";
    } else {
      // خروج طوعي + دفع غرامة
      switch (duration) {
        case '0-3m':
          banText = "لا يوجد منع (مشروط)";
          banColor = "bg-green-500";
          banDesc = "يمكنك العودة بشرط استخراج فيزا أو إقامة قانونية. (قاعدة 3 أشهر - 180 يوماً تطبق).";
          break;
        case '3m-6m':
          banText = "منع لمدة شهر واحد";
          banColor = "bg-orange-400";
          banDesc = "بسبب تجاوز المدة من 3 إلى 6 أشهر.";
          break;
        case '6m-1y':
          banText = "منع لمدة 3 أشهر";
          banColor = "bg-orange-500";
          banDesc = "بسبب تجاوز المدة من 6 أشهر إلى سنة.";
          break;
        case '1y-2y':
          banText = "منع لمدة سنة واحدة";
          banColor = "bg-red-400";
          banDesc = "بسبب تجاوز المدة من سنة إلى سنتين.";
          break;
        case '2y-3y':
          banText = "منع لمدة سنتين";
          banColor = "bg-red-500";
          banDesc = "بسبب تجاوز المدة من سنتين إلى 3 سنوات.";
          break;
        case '3y+':
          banText = "منع لمدة 5 سنوات";
          banColor = "bg-red-600";
          banDesc = "تجاوز المدة لأكثر من 3 سنوات يوجب المنع 5 سنوات حتى لو دفعت الغرامة.";
          break;
        default:
          banText = "يرجى التأكد من المدخلات";
      }
    }

    setResult({ text: banText, color: banColor, desc: banDesc });
  };

  return (
    <main className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">

      <PageHero
        title="حاسبة مدة المنع من تركيا"
        description="اعرف المدة القانونية لمنع الدخول إلى تركيا بناءً على مخالفتك."
        icon={<Calculator className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
      />
      <div className="flex justify-center -mt-4 mb-4">
        <ShareMenu title="حاسبة مدة المنع" text="اعرف المدة القانونية لمنع الدخول إلى تركيا بناءً على مخالفتك." url={`${SITE_CONFIG.siteUrl}/ban-calculator`} variant="subtle" />
      </div>

      {/* Main Container - Widened for horizontal layout */}
      <div className="max-w-5xl mx-auto px-4 py-8 mt-10 relative z-10">

        {/* Honest disclaimer — this is an estimate, NOT a legal ruling. Ban
            rules and codes change and depend on the individual case. */}
        <div className="max-w-3xl mx-auto mb-6 flex items-start gap-3 rounded-2xl border border-amber-300 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 p-4">
          <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
            هذه الأداة تعطي <strong>تقديراً مبدئياً للاسترشاد فقط</strong>، وليست قراراً قانونياً.
            قواعد المنع وأكوادها قد تتغيّر أو تختلف حسب الحالة، والمعلومة قد تكون قديمة؛
            المرجع النهائي هو الجهة الرسمية. تحقّق من{' '}
            <a href="https://www.goc.gov.tr" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-amber-700 dark:hover:text-amber-300">دائرة الهجرة (Göç İdaresi)</a>.
          </p>
        </div>

        {/* Compact Card — flat surface + accent stripe on the start edge */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          {/* Accent stripe — start edge (logical, RTL-safe) */}
          <span className="absolute top-0 end-0 h-full w-1 bg-gradient-to-b from-indigo-500 to-violet-500 opacity-80" />

          {/* Grid Layout for Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">

            {/* Input 1 */}
            <div>
              <label htmlFor="ban-duration" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                <Info size={16} className="text-blue-500" /> مدة المخالفة (الكسر):
              </label>
              <select
                id="ban-duration"
                name="ban-duration"
                aria-label="مدة المخالفة"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-slate-800 dark:text-slate-100 font-medium cursor-pointer transition-all hover:border-primary-400"
              >
                <option value="0-3m">أقل من 3 أشهر</option>
                <option value="3m-6m">3 - 6 أشهر</option>
                <option value="6m-1y">من 6 أشهر إلى سنة</option>
                <option value="1y-2y">من سنة إلى سنتين</option>
                <option value="2y-3y">من سنتين إلى 3 سنوات</option>
                <option value="3y+">أكثر من 3 سنوات</option>
              </select>
            </div>

            {/* Input 2 */}
            <div>
              <label htmlFor="exit-type" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                <Plane size={16} className="text-blue-500" /> طريقة الخروج:
              </label>
              <select
                id="exit-type"
                name="exit-type"
                aria-label="طريقة الخروج"
                value={exitType}
                onChange={(e) => setExitType(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-slate-800 dark:text-slate-100 font-medium cursor-pointer transition-all hover:border-primary-400"
              >
                <option value="voluntary">خروج طوعي (بنفسك)</option>
                <option value="deport">ترحيل (Deport)</option>
              </select>
            </div>

            {/* Input 3 */}
            <div>
              <label htmlFor="fine-paid" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                <CheckCircle size={16} className="text-blue-500" /> دفع الغرامة؟
              </label>
              <select
                id="fine-paid"
                name="fine-paid"
                aria-label="هل دُفعت الغرامة"
                value={finePaid}
                onChange={(e) => setFinePaid(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-slate-800 dark:text-slate-100 font-medium cursor-pointer transition-all hover:border-primary-400"
              >
                <option value="yes">نعم، دفعت كاملة</option>
                <option value="no">لا، لم أدفع</option>
              </select>
            </div>

          </div>

          {/* Calculate Button */}
          <div className="pt-8 flex justify-center pb-4">
            <button
              type="button"
              onClick={calculateBan}
              className="group/btn relative w-full md:w-1/3 bg-gradient-to-l from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white py-3.5 px-8 rounded-xl font-black text-lg shadow-lg shadow-indigo-600/30 hover:shadow-xl hover:shadow-indigo-600/40 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Calculator size={20} className="group-hover/btn:rotate-12 transition-transform" />
              احسب النتيجة
            </button>
          </div>

          {/* Result Section (Inline/Compact) — CSS-only reveal, re-runs per result via key */}
          {result && (
            <div
              key={result.text}
              className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 grid md:grid-cols-[auto_1fr] gap-6 items-center animate-in fade-in slide-in-from-bottom-4"
            >

              {/* Badge — accent stripe */}
              <div className={`relative overflow-hidden shrink-0 ${result.color} text-white py-5 px-8 rounded-2xl shadow-md text-center md:text-start min-w-[240px]`}>
                <span className="absolute top-0 end-0 h-full w-1.5 bg-white/30" />
                <p className="text-white/85 text-[10px] font-black mb-1 uppercase tracking-[0.2em]">تقدير مبدئي (غير رسمي)</p>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight">{result.text}</h2>
              </div>

              {/* Description — notice surface + accent */}
              <div className="relative overflow-hidden bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                <span className="absolute top-0 end-0 h-full w-1 bg-amber-500 opacity-70" />
                <AlertTriangle className="text-amber-500 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h4 className="font-black text-slate-800 dark:text-slate-200 text-sm mb-1">ملاحظات تقديرية:</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                    {result.desc}
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Cross-links — curated internal links for SEO */}
      <div className="w-full max-w-5xl mx-auto px-4 pb-4">
        <CrossLinks context="tool" />
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-12">
        <InlineRelatedArticles currentArticleId="" category="أنواع الإقامات" />
      </div>
    </main>
  );
}