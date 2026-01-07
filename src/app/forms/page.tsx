'use client';

import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import { useAdminForms } from '@/lib/useAdminData';
import { FileText, Download, Shield, Loader2, ExternalLink } from 'lucide-react';

export default function FormsPage() {
  const { forms, loading } = useAdminForms();

  return (
    <main className="flex flex-col min-h-screen">
      <PageHero
        title="مكتبة النماذج الجاهزة"
        description="عقود مترجمة، عرائض اعتراض، وطلبات رسمية جاهزة للتحميل والتعديل."
        icon={<FileText className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
      />

      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* تحذير قانوني */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border-r-4 border-amber-500 p-6 rounded-xl mb-12 flex gap-4">
          <Shield className="text-amber-600 flex-shrink-0" size={24} />
          <p className="text-amber-800 dark:text-amber-200 text-sm leading-relaxed">
            <strong>تنبيه قانوني:</strong> هذه النماذج هي صيغ قياسية للاسترشاد فقط. يُنصح دائماً بمراجعة محامٍ أو ترجمان محلف عند توقيع العقود ذات القيم المالية العالية أو القضايا الحساسة.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={40} className="animate-spin text-emerald-600" />
          </div>
        ) : forms.length > 0 ? (
          <div className="space-y-4">
            {forms.map((form) => (
              <div
                key={form.id}
                className="group bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-accent-500 transition-all flex flex-col md:flex-row md:items-center gap-6"
              >
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-primary-600">
                  <FileText size={32} />
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{form.name}</h3>
                    <span className="text-xs font-bold text-white bg-slate-400 px-2 py-1 rounded uppercase">{form.type}</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-300 text-sm">{form.desc}</p>
                </div>

                {form.url ? (
                  <a
                    href={form.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-200 px-6 py-3 rounded-xl font-bold hover:bg-primary-600 hover:text-white transition whitespace-nowrap"
                  >
                    <Download size={20} /> تحميل الملف
                  </a>
                ) : (
                  <span className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-500 px-6 py-3 rounded-xl font-bold whitespace-nowrap">
                    <ExternalLink size={20} /> قريباً
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
      </div>
      <Footer />
    </main>
  );
}
