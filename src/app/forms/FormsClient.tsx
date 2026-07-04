'use client';

import PageHero from '@/components/PageHero';
import { useAdminForms } from '@/lib/useAdminData';
import { FileText, Download, Shield, ExternalLink } from 'lucide-react';
import UniversalComments from '@/components/community/UniversalComments';
import type { AdminForm } from '@/lib/types';


export default function FormsClient({ initialForms = [] }: { initialForms?: AdminForm[] }) {
  // Seed from the server-provided forms so the full list renders on first
  // paint (SEO + no spinner). The admin hook still refreshes client side;
  // until it resolves we fall back to the server-provided rows.
  const { forms: liveForms, loading } = useAdminForms();
  const forms = loading && liveForms.length === 0 ? initialForms : liveForms;

  return (
    <main className="flex flex-col min-h-screen">
      <PageHero
        title="مكتبة النماذج الجاهزة"
        description="عقود مترجمة، عرائض اعتراض، وطلبات رسمية جاهزة للتحميل والتعديل."
        icon={<FileText className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
      />

      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* تحذير قانوني */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border-s-4 border-amber-500 p-6 rounded-xl mb-12 flex gap-4">
          <Shield className="text-amber-600 flex-shrink-0" size={24} />
          <p className="text-amber-800 dark:text-amber-200 text-sm leading-relaxed">
            <strong>تنبيه قانوني:</strong> هذه النماذج هي صيغ قياسية للاسترشاد فقط. يُنصح دائماً بمراجعة محامٍ أو ترجمان محلف عند توقيع العقود ذات القيم المالية العالية أو القضايا الحساسة.
          </p>
        </div>

        {forms.length > 0 ? (
          <div className="space-y-2.5">
            {forms.map((form) => (
              <div
                key={form.id}
                className="group bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-wrap sm:flex-nowrap items-center gap-x-3.5 gap-y-2"
              >
                {/* كعب نوع الملف — نمط أكعاب /codes بدل لوح الأيقونة الكبير */}
                <span
                  dir="ltr"
                  className="shrink-0 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-black uppercase tracking-wider"
                >
                  {form.type}
                </span>
                <div className="min-w-0 flex-1 basis-48">
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    {form.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{form.desc}</p>
                </div>

                {form.url ? (
                  <a
                    href={form.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap"
                  >
                    <Download size={16} /> تحميل الملف
                  </a>
                ) : (
                  <span className="shrink-0 inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap">
                    <ExternalLink size={16} /> قريباً
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-500">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p>لا توجد نماذج متاحة حالياً</p>
          </div>
        )}

        <div className="mt-16">
          <div className="">
            <UniversalComments entityType="article" entityId="forms-library" />
          </div>
        </div>
      </div>
    </main>
  );
}
