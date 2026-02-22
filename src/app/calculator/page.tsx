'use client';

import { useState } from 'react';
import PageHero from '@/components/PageHero';
import { Calculator } from 'lucide-react';
import ToolSchema from '@/components/ToolSchema';

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
      <ToolSchema tool="ban-calculator" />

      <PageHero
        title="حاسبة التكاليف"
        description="احسب التكلفة التقريبية لإقامتك في تركيا"
        icon={<Calculator size={40} />}
      />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-center mb-8 text-slate-900 dark:text-slate-100">
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

              {/* تفاصيل التكلفة */}
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-6 space-y-3 border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between text-slate-700 dark:text-slate-300">
                  <span>الضريبة</span>
                  <span className="font-semibold">{tax} TL</span>
                </div>
                <div className="flex justify-between text-slate-700 dark:text-slate-300">
                  <span>التأمين الصحي</span>
                  <span className="font-semibold">{insurance} TL</span>
                </div>
                <div className="flex justify-between text-slate-700 dark:text-slate-300">
                  <span>رسوم البطاقة</span>
                  <span className="font-semibold">{cardFee} TL</span>
                </div>
                <div className="border-t border-slate-300 dark:border-slate-700 pt-3 mt-3"></div>
                <div className="flex justify-between text-lg font-bold text-slate-900 dark:text-slate-100">
                  <span>الإجمالي</span>
                  <span className="text-emerald-600">{total} TL</span>
                </div>
              </div>

              {/* النتيجة الرئيسية */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 rounded-2xl text-center text-white shadow-lg">
                <p className="text-sm opacity-90 mb-2">التكلفة التقديرية الإجمالية</p>
                <span className="text-5xl font-bold block">{total} TL</span>
                <p className="text-xs opacity-75 mt-4">
                  * هذه تكلفة تقديرية وقد تختلف حسب الحالة الفعلية
                </p>
              </div>

              {/* ملاحظات */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-xl p-4">
                <h3 className="font-bold text-amber-900 dark:text-amber-200 mb-2 flex items-center gap-2">
                  <span className="text-lg">ℹ️</span>
                  ملاحظات هامة
                </h3>
                <ul className="text-sm text-amber-800 dark:text-amber-300 space-y-1 list-disc list-inside">
                  <li>الأسعار قد تتغير حسب القرارات الحكومية</li>
                  <li>التأمين الصحي يحسب بناءً على العمر</li>
                  <li>تكلفة المعاملة تختلف بين الأولى والتجديد</li>
                  <li>قد تضاف رسوم إضافية في بعض الحالات</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}