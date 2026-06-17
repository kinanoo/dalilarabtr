'use client';

import { useState } from 'react';
import PageHero from '@/components/PageHero';
import { Calculator, Sparkles, Receipt, Stethoscope, CreditCard, TrendingUp } from 'lucide-react';
import ToolSchema from '@/components/ToolSchema';
import RelatedArticles from '@/components/RelatedArticles';

export default function CalculatorPage() {
  const [age, setAge] = useState(25);
  const [type, setType] = useState('first'); // first or renew

  // معادلة تقريبية (وهمية للتمثيل)
  const tax = type === 'first' ? 3500 : 1500;
  const insurance = age * 50; // كل سنة ب 50 ليرة
  const cardFee = 565;
  const total = tax + insurance + cardFee;

  return (
    <>
      <ToolSchema tool="cost-calculator" />

      <PageHero
        title="حاسبة التكاليف"
        description="احسب التكلفة التقريبية لإقامتك في تركيا"
        icon={<Calculator size={40} />}
      />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">

          {/* Eyebrow */}
          <div className="flex items-center justify-center mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-[11px] font-black tracking-wider uppercase">
              <Sparkles size={12} />
              تقدير فوري
            </span>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/40 dark:from-slate-900 dark:to-emerald-950/20 rounded-2xl shadow-xl shadow-emerald-500/5 border border-slate-200 dark:border-slate-800 p-6 md:p-8">
            {/* Accent stripe — right edge in RTL */}
            <span className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-emerald-500 to-teal-500 opacity-80" />

            <h2 className="text-2xl font-black text-center mb-8 text-slate-900 dark:text-slate-100">
              حاسبة تكاليف الإقامة التقريبية
            </h2>

            <div className="space-y-6">
              {/* نوع المعاملة */}
              <div>
                <label htmlFor="transaction-type" className="block font-bold mb-3 text-slate-900 dark:text-slate-100">
                  نوع المعاملة
                </label>
                <select
                  id="transaction-type"
                  aria-label="نوع معاملة الإقامة"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                  <option value="first">أول مرة (جديدة)</option>
                  <option value="renew">تجديد</option>
                </select>
              </div>

              {/* العمر */}
              <div>
                <label htmlFor="age-slider" className="block font-bold mb-3 text-slate-900 dark:text-slate-100">
                  العمر: <span className="text-emerald-600">{age} سنة</span>
                </label>
                <input
                  type="range"
                  id="age-slider"
                  name="age"
                  min="18"
                  max="65"
                  value={age}
                  aria-label="العمر"
                  aria-valuenow={age}
                  aria-valuemin={18}
                  aria-valuemax={65}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  style={{
                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${((age - 18) / 47) * 100}%, #e2e8f0 ${((age - 18) / 47) * 100}%, #e2e8f0 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <span>18</span>
                  <span>65</span>
                </div>
              </div>

              {/* تفاصيل التكلفة — line items with icons */}
              <div className="relative overflow-hidden bg-white dark:bg-slate-950 rounded-xl p-6 space-y-3 border border-slate-200 dark:border-slate-800">
                <span className="absolute top-0 right-0 h-full w-0.5 bg-slate-300 dark:bg-slate-700" />

                <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-2">
                    <Receipt size={16} className="text-blue-500" />
                    الضريبة
                  </span>
                  <span className="font-black tabular-nums" dir="ltr">{tax} TL</span>
                </div>
                <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-2">
                    <Stethoscope size={16} className="text-rose-500" />
                    التأمين الصحي
                  </span>
                  <span className="font-black tabular-nums" dir="ltr">{insurance} TL</span>
                </div>
                <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-2">
                    <CreditCard size={16} className="text-violet-500" />
                    رسوم البطاقة
                  </span>
                  <span className="font-black tabular-nums" dir="ltr">{cardFee} TL</span>
                </div>
                <div className="border-t border-dashed border-slate-300 dark:border-slate-700 pt-3 mt-3"></div>
                <div className="flex justify-between items-center text-lg font-black text-slate-900 dark:text-slate-100">
                  <span className="flex items-center gap-2">
                    <TrendingUp size={18} className="text-emerald-600" />
                    الإجمالي
                  </span>
                  <span className="text-emerald-600 tabular-nums" dir="ltr">{total} TL</span>
                </div>
              </div>

              {/* النتيجة الرئيسية — premium gradient + accent stripe */}
              <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 p-8 rounded-2xl text-center text-white shadow-xl shadow-emerald-500/30">
                <span className="absolute top-0 right-0 h-full w-1.5 bg-white/30" />
                <span className="absolute -left-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

                <p className="text-[10px] tracking-[0.25em] font-black uppercase opacity-90 mb-2">التكلفة التقديرية الإجمالية</p>
                <span className="text-5xl md:text-6xl font-black block tabular-nums" dir="ltr">{total} TL</span>
                <p className="text-xs opacity-80 mt-4">
                  * هذه تكلفة تقديرية وقد تختلف حسب الحالة الفعلية
                </p>
              </div>

              {/* ملاحظات — accent stripe + gradient */}
              <div className="group/note relative overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-xl p-5">
                <span className="absolute top-0 right-0 h-full w-1 bg-amber-500 opacity-70" />
                <h3 className="font-black text-amber-900 dark:text-amber-200 mb-3 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-200 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                    ℹ
                  </span>
                  ملاحظات هامة
                </h3>
                <ul className="text-sm text-amber-800 dark:text-amber-300 space-y-1.5 list-disc list-inside leading-relaxed">
                  <li>الأسعار قد تتغير حسب القرارات الحكومية</li>
                  <li>التأمين الصحي يحسب بناءً على العمر</li>
                  <li>تكلفة المعاملة تختلف بين الأولى والتجديد</li>
                  <li>قد تضاف رسوم إضافية في بعض الحالات</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto mt-8">
          <RelatedArticles currentArticleId="" category="أنواع الإقامات" />
        </div>
      </div>
    </>
  );
}