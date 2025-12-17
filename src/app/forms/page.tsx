'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import { FORMS } from '@/lib/data';
import { FileText, Download, Shield } from 'lucide-react';

export default function FormsPage() {
  return (
    <main className="flex flex-col min-h-screen">
      <Navbar />

      <PageHero
        title="مكتبة النماذج الجاهزة"
        description="عقود مترجمة، عرائض اعتراض، وطلبات رسمية جاهزة للتحميل والتعديل."
        icon={<FileText className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
      />

      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="bg-amber-50 dark:bg-amber-950/30 border-r-4 border-amber-500 p-6 rounded-xl mb-12 flex gap-4">
          <Shield className="text-amber-600 flex-shrink-0" size={24} />
          <p className="text-amber-800 dark:text-amber-200 text-sm leading-relaxed">
            <strong>تنبيه قانوني:</strong> هذه النماذج هي صيغ قياسية للاسترشاد فقط. يُنصح دائماً بمراجعة محامٍ أو ترجمان محلف عند توقيع العقود ذات القيم المالية العالية أو القضايا الحساسة.
          </p>
        </div>

        <div className="space-y-4">
          {FORMS.map((form, idx) => (
            <div key={idx} className="group bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-accent-500 transition-all flex flex-col md:flex-row md:items-center gap-6">
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
              <button className="flex items-center justify-center gap-2 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-200 px-6 py-3 rounded-xl font-bold hover:bg-primary-600 hover:text-white transition whitespace-nowrap">
                <Download size={20} /> تحميل الملف
              </button>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}