'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, FileText, Smartphone, ShieldCheck } from 'lucide-react';
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

        {/* Category Filter Tabs */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                !activeCategory
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              الكل ({services.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat.label}
                onClick={() => setActiveCategory(activeCategory === cat.label ? null : cat.label)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  activeCategory === cat.label
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
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
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <FileText size={22} />
                  </div>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded whitespace-nowrap">
                    {service.lastUpdate}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2 leading-snug">
                  {service.title}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-6 flex-grow">
                  {service.intro}
                </p>

                <div className="flex items-center justify-between gap-3">
                  <Link
                    href={`/article/${service.slug || service.id}`}
                    className="text-primary-700 dark:text-primary-300 font-bold text-sm hover:underline"
                  >
                    اقرأ الشرح
                  </Link>

                  {service.source ? (
                    <a
                      href={service.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 flex items-center gap-2 text-sm"
                    >
                      زيارة الموقع <ExternalLink size={16} />
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
