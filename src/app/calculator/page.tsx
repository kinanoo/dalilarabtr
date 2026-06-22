'use client';

import PageHero from '@/components/PageHero';
import { Calculator, Receipt, ExternalLink, AlertTriangle } from 'lucide-react';
import ToolSchema from '@/components/ToolSchema';
import RelatedArticles from '@/components/RelatedArticles';

/*
 * Cost calculator — DISABLED on purpose.
 *
 * The previous version computed residence-permit costs from made-up numbers
 * (the code itself was labelled "معادلة تقريبية وهمية" / fake-for-illustration:
 * tax = 3500/1500, insurance = age*50, cardFee = 565). Showing fabricated TL
 * amounts to a financially-stressed audience as if they were real fees is a
 * credibility and trust risk, so the estimate is removed.
 *
 * To restore a REAL calculator later: source the official fee table (harç) from
 * Göç İdaresi / e-ikamet, plug the verified figures into a small table, and
 * replace this notice with the computed breakdown — keeping a visible source +
 * "last updated" date. Do NOT re-introduce unsourced numbers.
 */

const OFFICIAL_FEE_URL = 'https://e-ikamet.goc.gov.tr';

export default function CalculatorPage() {
  return (
    <>
      <ToolSchema tool="cost-calculator" />

      <PageHero
        title="تكاليف الإقامة"
        description="رسوم الإقامة الرسمية ومن أين تتحقق منها"
        icon={<Calculator size={40} />}
      />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">

          <div className="relative overflow-hidden bg-gradient-to-br from-white to-amber-50/40 dark:from-slate-900 dark:to-amber-950/20 rounded-2xl shadow-xl border border-amber-200 dark:border-amber-900/40 p-6 md:p-8">
            <span className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-amber-500 to-orange-500 opacity-80" />

            <div className="flex items-start gap-3 mb-5">
              <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 shrink-0">
                <AlertTriangle size={22} />
              </span>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-1">
                  لا نعرض أرقاماً غير رسمية
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  رسوم الإقامة تتغيّر بقرارات حكومية وتختلف حسب نوع الإقامة وجنسيتك ومدّتها.
                  حتى لا نضلّلك برقم تقديري قد يكون خاطئاً، نوجّهك مباشرةً إلى المصدر الرسمي
                  لمعرفة الرسوم المحدّثة.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-950 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold">
                <Receipt size={18} className="text-emerald-600" />
                أين تتحقق من الرسوم الرسمية؟
              </div>
              <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2 list-disc list-inside leading-relaxed">
                <li>منصّة الإقامة الإلكترونية الرسمية (e-ikamet) تعرض الرسوم أثناء تعبئة الطلب.</li>
                <li>دائرة الهجرة (Göç İdaresi) في ولايتك تؤكّد لك المبلغ النهائي.</li>
                <li>تشمل التكلفة عادةً: رسم الإقامة، رسم البطاقة، والتأمين الصحي إن لزم — وكلّها تتغيّر دورياً.</li>
              </ul>
              <a
                href={OFFICIAL_FEE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-3 rounded-xl transition-colors"
              >
                المصدر الرسمي للرسوم (e-ikamet)
                <ExternalLink size={16} />
              </a>
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
