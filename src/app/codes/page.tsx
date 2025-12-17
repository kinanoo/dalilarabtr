'use client';
import { Metadata } from 'next';
import ToolSchema from '@/components/ToolSchema';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import HeroSearchInput from '@/components/HeroSearchInput';
import { useAdminCodes } from '@/lib/useAdminData';
import { useState } from 'react';
import { ShieldAlert, AlertTriangle, Info, CheckCircle, Loader2 } from 'lucide-react';
import ShareMenu from '@/components/ShareMenu';

export default function CodesPage() {
  const { codes, loading } = useAdminCodes();
  const [query, setQuery] = useState('');

  // فلترة الأكواد
  const filteredCodes = codes.filter(item =>
    item.code.toLowerCase().includes(query.toLowerCase()) ||
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.desc.toLowerCase().includes(query.toLowerCase())
  );

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical': return 'خطير جداً';
      case 'high': return 'عالي الخطورة';
      case 'medium': return 'متوسط';
      case 'low': return 'منخفض';
      case 'safe': return 'آمن';
      default: return 'غير محدد';
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50/70 text-red-900 dark:bg-red-950/20 dark:text-red-100';
      case 'high': return 'border-orange-500 bg-orange-50/70 text-orange-900 dark:bg-orange-950/20 dark:text-orange-100';
      case 'medium': return 'border-yellow-500 bg-yellow-50/70 text-yellow-900 dark:bg-yellow-950/20 dark:text-yellow-100';
      case 'safe': return 'border-green-500 bg-green-50/70 text-green-900 dark:bg-green-950/20 dark:text-green-100';
      case 'low': return 'border-slate-300 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-100';
      default: return 'border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';
    }
  };

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ShieldAlert className="text-red-600" size={24} />;
      case 'high': return <AlertTriangle className="text-orange-600" size={24} />;
      case 'medium': return <Info className="text-yellow-600" size={24} />;
      default: return <CheckCircle className="text-green-600" size={24} />;
    }
  };

  return (
    <main className="flex flex-col min-h-screen">
      <Navbar />
      <ToolSchema tool="security-codes" />
      <PageHero
        title="دليل الأكواد الأمنية (Tahdit Kodları)"
        description="ابحث عن أي كود (V87, G87, Ç114) واعرف معناه القانوني ومدى خطورته."
        icon={<ShieldAlert className="w-10 h-10 md:w-12 md:h-12 text-red-500" />}
      >
        <HeroSearchInput
          value={query}
          onChange={setQuery}
          placeholder="اكتب الكود هنا... (مثال: V87)"
          dir="ltr"
          inputClassName="font-bold uppercase tracking-wider placeholder:text-right placeholder:[direction:rtl]"
        />
      </PageHero>

      <div className="max-w-4xl mx-auto px-4 py-12 w-full">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={40} className="animate-spin text-emerald-600" />
          </div>
        ) : filteredCodes.length > 0 ? (
          <div className="space-y-3">
            {filteredCodes.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition ${getSeverityStyles(item.severity)}`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">{getIcon(item.severity)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-base sm:text-lg font-black tracking-wide">{item.code}</span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/60 dark:bg-white/10">
                              {item.category}
                            </span>
                          </div>
                          <h3 className="font-bold text-sm sm:text-base mt-1 truncate">{item.title}</h3>
                        </div>
                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-white/60 dark:bg-white/10 shrink-0">
                          {getSeverityLabel(item.severity)}
                        </span>
                      </div>
                      <p className="text-sm opacity-90 leading-relaxed mt-2">{item.desc}</p>
                      <div className="flex items-center justify-between mt-3">
                        <ShareMenu
                          title={`شرح الكود ${item.code}: ${item.title}`}
                          text={item.desc}
                          mini={true}
                          customClass="!bg-white/60 hover:!bg-white dark:!bg-white/10 dark:hover:!bg-white/20"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-1 w-full border-t border-black/5 dark:border-white/5" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 dark:text-slate-300">
            لا توجد أكواد تطابق بحثك.
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
