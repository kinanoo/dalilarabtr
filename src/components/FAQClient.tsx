'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import * as React from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Search } from 'lucide-react';
import { minTokenMatches, normalizeArabic, tokenizeArabicQuery } from '@/lib/arabicSearch';

export type FAQQuestion = { id: string; q: string; a: string };
export type FAQCategory = { category: string; questions: FAQQuestion[] };

function getCategoryPriority(categoryName: string): number {
  const name = normalizeArabic(categoryName);

  // Put "الأكثر بحثاً" after the main topical buckets.
  if (name.includes('الاكثر بحثا') || name.includes('الأكثر بحثاً') || name.includes('الترند')) return 90;

  // 1) Temporary protection / Kimlik
  if (
    name.includes('كملك') ||
    name.includes('الحمايه المؤقته') ||
    name.includes('الحماية المؤقتة') ||
    name.includes('سوري') ||
    name.includes('السوريين')
  ) {
    return 10;
  }

  // 2) Residences / Ikamet
  if (
    name.includes('اقامه') ||
    name.includes('إقامة') ||
    name.includes('اقامات') ||
    name.includes('إقامات') ||
    name.includes('ايكامت') ||
    name.includes('ikamet')
  ) {
    return 20;
  }

  // 3) Daily life
  if (name.includes('الحياه اليوميه') || name.includes('الحياة اليومية') || name.includes('الحياه') || name.includes('معيش')) {
    return 30;
  }

  // 4) Work / legal
  if (name.includes('عمل') || name.includes('قانون') || name.includes('محكم') || name.includes('uyap')) {
    return 40;
  }

  // 5) Education
  if (name.includes('دراس') || name.includes('تعليم') || name.includes('جامع') || name.includes('مدرس')) {
    return 50;
  }

  // 6) Health
  if (name.includes('صح') || name.includes('تامين') || name.includes('تأمين') || name.includes('مشفى') || name.includes('مشافي')) {
    return 60;
  }

  return 80;
}

function sortFaqCategories(categories: FAQCategory[]): FAQCategory[] {
  return categories
    .map((cat, index) => ({ cat, index, priority: getCategoryPriority(cat.category) }))
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.index - b.index;
    })
    .map((x) => x.cat);
}

export default function FAQClient({
  data,
  totalCount,
  initialSearchTerm
}: {
  data: FAQCategory[];
  totalCount?: number;
  initialSearchTerm?: string;
}) {
  const [openIndex, setOpenIndex] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState(initialSearchTerm ?? '');

  React.useEffect(() => {
    if (typeof initialSearchTerm === 'string') {
      setSearchTerm(initialSearchTerm);
      return;
    }

    if (typeof window === 'undefined') return;
    try {
      const q = new URLSearchParams(window.location.search).get('q') ?? '';
      setSearchTerm(q);
    } catch {
      // ignore
    }
  }, [initialSearchTerm]);

  const toggleQuestion = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  const normalizedSearch = React.useMemo(() => normalizeArabic(searchTerm), [searchTerm]);
  const searchTokens = React.useMemo(() => tokenizeArabicQuery(searchTerm), [searchTerm]);

  const filteredData = React.useMemo(() => {
    if (!normalizedSearch) return data;

    const minMatched = minTokenMatches(searchTokens);

    return data
      .map((category) => {
        const questions = category.questions.filter((q) => {
          const haystack = normalizeArabic(`${q.q} ${q.a}`);

          if (searchTokens.length === 0) {
            return haystack.includes(normalizedSearch);
          }

          let matched = 0;
          for (const token of searchTokens) {
            if (haystack.includes(token)) matched += 1;
          }
          return matched >= minMatched;
        });

        return { ...category, questions };
      })
      .filter((cat) => cat.questions.length > 0);
  }, [data, normalizedSearch, searchTokens]);

  const flatQuestions = React.useMemo(() => {
    const ordered = sortFaqCategories(filteredData);
    return ordered.flatMap((cat) => cat.questions);
  }, [filteredData]);

  return (
    <main className="flex flex-col min-h-screen">
      <Navbar />

      <div className="bg-primary-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <HelpCircle className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />
            <h1 className="text-4xl font-bold">الأسئلة الأكثر شيوعاً</h1>
          </div>
          <p className="text-xl text-slate-300">
            {typeof totalCount === 'number' && totalCount > 0
              ? `إجابات قانونية ودقيقة لأكثر من ${totalCount} سؤال يهمك.`
              : 'إجابات قانونية ودقيقة لأكثر الأسئلة شيوعاً.'}
          </p>

          <div className="relative max-w-lg mx-auto mt-8">
            <input
              type="text"
              placeholder="ابحث في الأسئلة..."
              className="w-full p-4 rounded-full text-slate-800 dark:text-slate-100 pr-12 focus:outline-none shadow-lg bg-white dark:bg-slate-900 placeholder:text-slate-400 dark:placeholder:text-slate-400"
              onChange={e => setSearchTerm(e.target.value)}
              value={searchTerm}
            />
            <Search className="absolute right-4 top-4 text-slate-400" />
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-4">
          {flatQuestions.map(item => {
            const isOpen = openIndex === item.id;

            return (
              <div
                key={item.id}
                className="w-full bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden"
              >
                <button
                  onClick={() => toggleQuestion(item.id)}
                  className="w-full flex items-start justify-between gap-4 p-5 text-right hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <span className="flex-1 min-w-0 font-bold text-slate-800 dark:text-slate-100 text-lg leading-snug">
                    {item.q}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="text-accent-500" />
                  ) : (
                    <ChevronDown className="text-slate-400 dark:text-slate-500" />
                  )}
                </button>

                {isOpen && (
                  <div className="w-full p-5 pt-0 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
                    <div className="w-full text-right text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line break-words">
                      {item.a}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {flatQuestions.length === 0 && (
          <div className="text-center py-10 text-slate-500 dark:text-slate-300">
            لا توجد أسئلة تطابق بحثك.
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
