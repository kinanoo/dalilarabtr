import Link from 'next/link';
import { ShieldCheck, Scale } from 'lucide-react';

/**
 * CodesLegalNote — the legal-trust stamp for the security-codes pages.
 *
 * Shows (1) the last legal-audit date — truthful: on 2026-07-09 every row of
 * security_codes was compared against multiple Turkish legal references by a
 * two-researcher + comparator process and corrected in both Arabic and
 * Turkish; update the date ONLY when a real re-audit happens — and (2) the
 * YMYL disclaimer that code meanings are informational and case-specific.
 * Server component; used on /codes and /codes/[code].
 */
export default function CodesLegalNote({ variant = 'full' }: { variant?: 'full' | 'stamp' }) {
  if (variant === 'stamp') {
    // Stamp only — for the code detail page, which already carries its own
    // bilingual disclaimer (ui.disclaimer).
    return (
      <div className="mt-4 flex items-start gap-3 bg-emerald-600/[0.06] dark:bg-emerald-400/10 border border-emerald-600/15 dark:border-emerald-400/20 rounded-2xl p-4" dir="rtl">
        <ShieldCheck size={18} className="text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <strong className="text-emerald-800 dark:text-emerald-200">آخر تدقيق قانوني: 9 يوليو 2026</strong>
          {' '}— قورن معنى هذا الكود وشرحه (بالعربية والتركية) مع مصادر قانونية تركية متخصصة متعددة.
        </p>
      </div>
    );
  }
  return (
    <div className="max-w-4xl mx-auto px-4 my-8 space-y-3" dir="rtl">
      <div className="flex items-start gap-3 bg-emerald-600/[0.06] dark:bg-emerald-400/10 border border-emerald-600/15 dark:border-emerald-400/20 rounded-2xl p-4">
        <ShieldCheck size={18} className="text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <strong className="text-emerald-800 dark:text-emerald-200">آخر تدقيق قانوني: 9 يوليو 2026</strong>
          {' '}— قورنت معاني الأكواد وشروحها (بالعربية والتركية) مع مصادر قانونية تركية متخصصة متعددة،
          وصُحّح كل اختلاف موثّق. نحدّث هذا التاريخ عند كل تدقيق جديد.
        </p>
      </div>
      <div className="flex items-start gap-3 bg-amber-500/[0.07] dark:bg-amber-400/10 border border-amber-500/20 dark:border-amber-400/20 rounded-2xl p-4">
        <Scale size={18} className="text-amber-700 dark:text-amber-300 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          هذه المعلومات تعريفية عامة ولا تكفي وحدها لاتخاذ قرار قانوني: الكود نفسه قد يوضع لأسباب
          مختلفة، وسبب حالتك بالضبط لا يُعرف إلا بالاستعلام الرسمي، ورفعه غالباً يحتاج محامياً مختصاً
          بقضايا الأجانب. لا تدفع لأي جهة تعدك بإزالة الكود قبل معرفة السبب الحقيقي —
          راجع <Link href="/disclaimer" className="font-bold text-amber-800 dark:text-amber-200 hover:underline">إخلاء المسؤولية</Link>.
        </p>
      </div>
    </div>
  );
}
