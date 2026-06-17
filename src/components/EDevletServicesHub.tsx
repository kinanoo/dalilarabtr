'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, FileText, Smartphone, ShieldCheck, Sparkles } from 'lucide-react';
import { minTokenMatches, normalizeArabic, tokenizeArabicQuery } from '@/lib/arabicSearch';
import PageHero from '@/components/PageHero';
import HeroSearchInput from '@/components/HeroSearchInput';

type EDevletService = {
  id: string;
  title: string;
  intro: string;
  lastUpdate: string;
  source?: string;
  slug?: string;
};

// Auto-categorize services based on title keywords
const CATEGORY_RULES: { label: string; keywords: string[] }[] = [
  { label: 'النفوس والسجلات', keywords: ['نفوس', 'كملك', 'kimlik', 'إقامة', 'عنوان', 'ميلاد', 'زواج', 'عائلة', 'جنسية'] },
  { label: 'الضرائب والمالية', keywords: ['ضريب', 'vergi', 'مالي', 'دخل', 'فاتورة'] },
  { label: 'الصحة والتأمين', keywords: ['صح', 'تأمين', 'sağlık', 'sgk', 'طب', 'مستشف', 'دواء'] },
  { label: 'التعليم', keywords: ['تعليم', 'مدرس', 'جامع', 'طالب', 'شهادة', 'معادلة'] },
  { label: 'العقارات والطابو', keywords: ['طابو', 'عقار', 'tapu', 'ملكية', 'شقة'] },
  { label: 'المحاكم والقانون', keywords: ['محكم', 'قانون', 'قضائ', 'دعوى', 'حقوق'] },
  { label: 'النقل والمواصلات', keywords: ['رخصة', 'سيارة', 'مرور', 'ehliyet', 'سفر', 'جواز'] },
];

function categorizeService(title: string, intro: string): string {
  const text = normalizeArabic(`${title} ${intro}`).toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(kw => text.includes(kw))) return rule.label;
  }
  return 'خدمات أخرى';
}

export default function EDevletServicesHub({
  services,
}: {
  services: EDevletService[];
}) {
  const [filter, setFilter] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Group services by auto-detected category
  const categorizedServices = useMemo(() => {
    return services.map(s => ({
      ...s,
      category: categorizeService(s.title, s.intro),
    }));
  }, [services]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of categorizedServices) {
      counts.set(s.category, (counts.get(s.category) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count }));
  }, [categorizedServices]);

  const filteredServices = useMemo(() => {
    let result = categorizedServices;

    // Filter by category
    if (activeCategory) {
      result = result.filter(s => s.category === activeCategory);
    }

    // Filter by search
    const tokens = tokenizeArabicQuery(filter);
    if (!tokens.length) return result;

    const minMatched = minTokenMatches(tokens);

    return result.filter((s) => {
      const haystack = normalizeArabic(`${s.title} ${s.intro}`);
      let matched = 0;
      for (const token of tokens) {
        if (haystack.includes(token)) matched += 1;
      }
      return matched >= minMatched;
    });
  }, [filter, categorizedServices, activeCategory]);

  return (
    <>
      <PageHero
        title="خدمات e-Devlet"
        description="قائمة الخدمات مع مقالات الشرح والرابط الرسمي المباشر (turkiye.gov.tr)"
        icon={<Smartphone className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
      >
        <HeroSearchInput
          value={filter}
          onChange={setFilter}
          placeholder="ابحث داخل خدمات e‑Devlet..."
        />
      </PageHero>

      <div className="flex-grow max-w-screen-2xl mx-auto px-4 py-12 w-full">

        {/* Eyebrow */}
        <div className="flex items-center justify-center mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-full text-[11px] font-black tracking-wider uppercase">
            <Sparkles size={12} />
            خدمات حكومية
          </span>
        </div>

        {/* Category Filter Tabs — gradient active state */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-black transition-all ${
                !activeCategory
                  ? 'bg-gradient-to-l from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/30'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-cyan-400'
              }`}
            >
              الكل ({services.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat.label}
                onClick={() => setActiveCategory(activeCategory === cat.label ? null : cat.label)}
                className={`px-4 py-2 rounded-full text-sm font-black transition-all ${
                  activeCategory === cat.label
                    ? 'bg-gradient-to-l from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/30'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-cyan-400'
                }`}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>
        )}

        {filteredServices.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="group relative overflow-hidden bg-gradient-to-br from-white to-cyan-50/40 dark:from-slate-900 dark:to-cyan-950/20 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col hover:shadow-xl hover:shadow-cyan-500/10 hover:border-cyan-400 hover:-translate-y-1 transition-all duration-300"
              >
                {/* Accent stripe — right edge in RTL */}
                <span className="absolute top-0 right-0 h-full w-1 bg-cyan-500 opacity-70 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="p-3 rounded-2xl bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-sm">
                    <FileText size={22} />
                  </div>
                  <span className="text-xs font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg whitespace-nowrap tabular-nums" dir="ltr">
                    {service.lastUpdate}
                  </span>
                </div>

                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-2 leading-snug group-hover:text-cyan-600 transition-colors">
                  {service.title}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-6 flex-grow leading-relaxed">
                  {service.intro}
                </p>

                <div className="flex items-center justify-between gap-3">
                  <Link
                    href={`/article/${service.slug || service.id}`}
                    className="text-cyan-700 dark:text-cyan-300 font-black text-sm hover:underline"
                  >
                    اقرأ الشرح
                  </Link>

                  {service.source ? (
                    <a
                      href={service.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/visit bg-gradient-to-l from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-xl font-black hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 hover:-translate-y-0.5 flex items-center gap-2 text-sm"
                    >
                      زيارة الموقع
                      <ExternalLink size={16} className="group-hover/visit:rotate-12 transition-transform" />
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-lg text-slate-500 dark:text-slate-300">لا توجد نتائج مطابقة.</p>
          </div>
        )}

        {/* Last verified date */}
        <div className="mt-12 text-center pt-6 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-2">
            <ShieldCheck size={12} className="text-green-500" />
            آخر تحقق من صلاحية الروابط: مارس 2026
          </p>
        </div>
      </div>
    </>
  );
}
