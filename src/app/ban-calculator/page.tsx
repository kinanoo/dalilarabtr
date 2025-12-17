'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import { useState } from 'react';
import { Calculator, AlertTriangle, CheckCircle, Info, Plane } from 'lucide-react';
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
    <main className="flex flex-col min-h-screen">
      <Navbar />

      <PageHero
        title="حاسبة مدة المنع (Tahdit Kodlari)"
        description="اعرف المدة القانونية لمنع الدخول إلى تركيا بناءً على مخالفتك."
        icon={<Calculator className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
      />

      <div className="max-w-xl mx-auto px-4 py-12 -mt-10 relative z-10">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800">
          
          <div className="space-y-6">
            {/* السؤال 1: مدة المخالفة */}
            <div>
              <label className="block text-slate-700 dark:text-slate-200 font-bold mb-2 flex items-center gap-2">
                <Info size={18} className="text-blue-500"/> مدة المخالفة (الكسر):
              </label>
              <select 
                value={duration} 
                onChange={(e) => setDuration(e.target.value)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-slate-700 dark:text-slate-100 font-medium appearance-none cursor-pointer"
              >
                <option value="0-3m">أقل من 3 أشهر</option>
                <option value="3m-6m">من 3 أشهر - 6 أشهر</option>
                <option value="6m-1y">من 6 أشهر - 1 سنة</option>
                <option value="1y-2y">من 1 سنة - 2 سنة</option>
                <option value="2y-3y">من 2 سنة - 3 سنوات</option>
                <option value="3y+">أكثر من 3 سنوات</option>
              </select>
            </div>

            {/* السؤال 2: نوع الخروج */}
            <div>
              <label className="block text-slate-700 dark:text-slate-200 font-bold mb-2 flex items-center gap-2">
                <Plane size={18} className="text-blue-500"/> طريقة الخروج:
              </label>
              <select 
                value={exitType} 
                onChange={(e) => setExitType(e.target.value)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-slate-700 dark:text-slate-100 font-medium appearance-none cursor-pointer"
              >
                <option value="voluntary">خروج طوعي (ذهبت للمطار بنفسك)</option>
                <option value="deport">ترحيل قسري (Deport) / قرار محكمة</option>
              </select>
            </div>

            {/* السؤال 3: دفع الغرامة */}
            <div>
              <label className="block text-slate-700 dark:text-slate-200 font-bold mb-2 flex items-center gap-2">
                <CheckCircle size={18} className="text-blue-500"/> هل دفعت الغرامة في المطار؟
              </label>
              <select 
                value={finePaid} 
                onChange={(e) => setFinePaid(e.target.value)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-slate-700 dark:text-slate-100 font-medium appearance-none cursor-pointer"
              >
                <option value="yes">نعم، دفعت الغرامة كاملة</option>
                <option value="no">لا، لم أدفع / لم يكن معي مال</option>
              </select>
            </div>

            <button 
              onClick={calculateBan}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20 mt-4"
            >
              احسب مدة المنع
            </button>
          </div>

          {/* النتيجة */}
          <AnimatePresence>
            {result && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 text-center"
              >
                <p className="text-slate-400 dark:text-slate-400 font-bold mb-2 text-sm uppercase tracking-wider">النتيجة المتوقعة</p>
                <div className={`${result.color} text-white py-4 px-6 rounded-2xl shadow-md inline-block min-w-[200px]`}>
                  <h2 className="text-2xl font-black">{result.text}</h2>
                </div>
                <div className="mt-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl text-sm text-slate-600 dark:text-slate-300 leading-relaxed border border-slate-200 dark:border-slate-700 flex items-start gap-3 text-right">
                  <AlertTriangle className="text-amber-500 flex-shrink-0" size={20}/>
                  <p>{result.desc}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
      <Footer />
    </main>
  );
}