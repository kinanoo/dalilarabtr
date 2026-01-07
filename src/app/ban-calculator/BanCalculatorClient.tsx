
'use client';

import PageHero from '@/components/PageHero';
import { useState } from 'react';
import { Calculator, AlertTriangle, CheckCircle, Info, Plane, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
      banDesc = "عدم دفع الغرامة في المطار عند الخروج الطوعي يفرض كود منع (Ç-114) لمدة 5 سنوات.";
    } else {
      // خروج طوعي + دفع غرامة
      switch (duration) {
        case '0-3m':
          banText = "لا يوجد منع (مشروط)";
          banColor = "bg-green-500";
          banDesc = "يمكنك العودة بشرط استخراج فيزا أو إقامة قانونية. (قاعدة 3 أشهر - 180 يوماً تطبق).";
          break;
        case '3m-6m':
          banText = "منع لمدة 1 شهر";
          banColor = "bg-orange-400";
          banDesc = "بسبب تجاوز المدة من 3 إلى 6 أشهر.";
          break;
        case '6m-1y':
          banText = "منع لمدة 3 أشهر";
          banColor = "bg-orange-500";
          banDesc = "بسبب تجاوز المدة من 6 أشهر إلى سنة.";
          break;
        case '1y-2y':
          banText = "منع لمدة 1 سنة";
          banColor = "bg-red-400";
          banDesc = "بسبب تجاوز المدة من سنة إلى سنتين.";
          break;
        case '2y-3y':
          banText = "منع لمدة 2 سنة";
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
        title="حاسبة مدة المنع (Tahdit Kodlari)"
        description="اعرف المدة القانونية لمنع الدخول إلى تركيا بناءً على مخالفتك."
        icon={<Calculator className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
      />

      {/* Main Container - Widened for horizontal layout */}
      <div className="max-w-5xl mx-auto px-4 py-8 mt-10 relative z-10">

        {/* Compact Card - Taller & Square-like */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] shadow-xl border border-slate-300 dark:border-slate-800 min-h-[550px] flex flex-col">

          {/* Grid Layout for Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">

            {/* Input 1 */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                <Info size={16} className="text-blue-500" /> مدة المخالفة (الكسر):
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-slate-800 dark:text-slate-100 font-medium cursor-pointer transition-all hover:border-primary-400"
              >
                <option value="0-3m">أقل من 3 أشهر</option>
                <option value="3m-6m">3 - 6 أشهر</option>
                <option value="6m-1y">6 أشهر - 1 سنة</option>
                <option value="1y-2y">1 - 2 سنة</option>
                <option value="2y-3y">2 - 3 سنوات</option>
                <option value="3y+">أكثر من 3 سنوات</option>
              </select>
            </div>

            {/* Input 2 */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                <Plane size={16} className="text-blue-500" /> طريقة الخروج:
              </label>
              <select
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
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                <CheckCircle size={16} className="text-blue-500" /> دفع الغرامة؟
              </label>
              <select
                value={finePaid}
                onChange={(e) => setFinePaid(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-slate-800 dark:text-slate-100 font-medium cursor-pointer transition-all hover:border-primary-400"
              >
                <option value="yes">نعم، دفعت كاملة</option>
                <option value="no">لا، لم أدفع</option>
              </select>
            </div>

          </div>

          {/* Calculate Button - Pushed to Bottom */}
          <div className="mt-auto pt-8 flex justify-center pb-4">
            <button
              onClick={calculateBan}
              className="w-full md:w-1/3 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-8 rounded-xl font-bold text-lg shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Calculator size={20} />
              احسب النتيجة
            </button>
          </div>

          {/* Result Section (Inline/Compact) */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                key={result.text}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 grid md:grid-cols-[auto_1fr] gap-6 items-center animate-in fade-in slide-in-from-bottom-4">

                  {/* Badge */}
                  <div className={`shrink-0 ${result.color} text-white py-4 px-8 rounded-2xl shadow-md text-center md:text-right min-w-[240px]`}>
                    <p className="text-white/80 text-xs font-bold mb-1 uppercase tracking-wider">قرار المنع المتوقع</p>
                    <h2 className="text-2xl font-black">{result.text}</h2>
                  </div>

                  {/* Description */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                    <AlertTriangle className="text-amber-500 flex-shrink-0 mt-1" size={24} />
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">تفاصيل القانون:</h4>
                      <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                        {result.desc}
                      </p>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </main>
  );
}