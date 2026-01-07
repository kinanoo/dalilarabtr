'use client';
import { Metadata } from 'next';
import ToolSchema from '@/components/ToolSchema';

import PageHero from '@/components/PageHero';
import HeroSearchInput from '@/components/HeroSearchInput';
import { useAdminCodes } from '@/lib/useAdminData';
import { useState } from 'react';
import { ShieldAlert, AlertTriangle, Info, CheckCircle, Loader2 } from 'lucide-react';
import ShareMenu from '@/components/ShareMenu';
import { intelligentTokenize } from '@/lib/intelligentSearch';
import { normalizeArabic } from '@/lib/arabicSearch';

export default function CodesPage() {
  const { codes, loading } = useAdminCodes();
  const [query, setQuery] = useState('');

  // 🧠 فلترة الأكواد بالبحث الذكي
  const filteredCodes = codes.filter(item => {
    if (!query.trim()) return true;

    const { originalTokens, expandedTokens } = intelligentTokenize(query);
    const searchText = normalizeArabic(`${item.code} ${item.title} ${item.desc}`);
    const needle = normalizeArabic(query);

    let score = 0;
    let hasOriginalKeyword = false;

    originalTokens.forEach((token: string) => {
      if (searchText.includes(normalizeArabic(token))) {
        hasOriginalKeyword = true;
        score += 20;
      }
    });

    if (!hasOriginalKeyword) return false;

    expandedTokens.forEach((term: string) => {
      if (!originalTokens.includes(term) && searchText.includes(normalizeArabic(term))) {
        score += 8;
      }
    });

    if (searchText.includes(needle)) score += 25;

    return score >= 10;
  });

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
      <ToolSchema tool="security-codes" />

      <PageHero
        title="كاشف ومحلل الأكواد الأمنية"
        description="افهم كل أكواد المنع والحظر بالتفصيل"
        icon={<ShieldAlert className="w-10 h-10 md:w-12 md:h-12 text-red-500" />}
      >
        <HeroSearchInput
          value={query}
          onChange={setQuery}
          placeholder="اكتب الكود أو ابحث بالوصف... (مثال: V87، منع السفر...)"
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
                      <p className="text-xs sm:text-sm mt-2 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <ShieldAlert size={64} className="mx-auto mb-4 text-slate-300 dark:text-slate-700" />
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">
              لا توجد أكواد مطابقة لـ &quot;{query}&quot;
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              جرب البحث بكود مختلف أو كلمات أخرى
            </p>
          </div>
        )}
      </div>

      <ShareMenu title="كاشف الأكواد الأمنية - دليل العرب في تركيا" />
    </main>
  );
}
