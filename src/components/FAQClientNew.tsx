'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, ChevronRight, ChevronDown, Home, Briefcase, GraduationCap, Plane, Building2, Stethoscope, Shield, Scale, FileText, HelpCircle, MapPin, Wallet } from 'lucide-react';
import Accordion from '@/components/ui/Accordion';
import EmptyState from '@/components/EmptyState';
import { FAQCategory } from '@/lib/faq-types';
import { intelligentTokenize } from '@/lib/intelligentSearch';
import { normalizeArabic } from '@/lib/arabicSearch';

import { useSearchParams } from 'next/navigation';

// Category visual config — color + icon for known categories
const CATEGORY_STYLES: Record<string, { icon: typeof Home; bg: string; text: string; border: string }> = {
  'الإقامة في تركيا': { icon: Home, bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  'الكملك': { icon: Shield, bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
  'إذن العمل': { icon: Briefcase, bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
  'التعليم': { icon: GraduationCap, bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800' },
  'الصحة والتأمين': { icon: Stethoscope, bg: 'bg-teal-50 dark:bg-teal-950/30', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800' },
  'السفر والتأشيرات': { icon: Plane, bg: 'bg-cyan-50 dark:bg-cyan-950/30', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800' },
  'القنصلية': { icon: Building2, bg: 'bg-indigo-50 dark:bg-indigo-950/30', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800' },
  'الشؤون القانونية': { icon: Scale, bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
  'الجنسية التركية': { icon: FileText, bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
  'السكن': { icon: MapPin, bg: 'bg-pink-50 dark:bg-pink-950/30', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-800' },
  'المالية والضرائب': { icon: Wallet, bg: 'bg-lime-50 dark:bg-lime-950/30', text: 'text-lime-600 dark:text-lime-400', border: 'border-lime-200 dark:border-lime-800' },
};

const DEFAULT_STYLE = { icon: HelpCircle, bg: 'bg-slate-50 dark:bg-slate-800/50', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700' };

interface FAQClientProps {
  staticData: FAQCategory[];
  totalCount: number;
}

const ITEMS_PER_PAGE = 15;

export default function FAQClientNew({ staticData, totalCount }: FAQClientProps) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  // 🧠 Smart Search & Filter
  const filteredData = useMemo(() => {
    let filtered = staticData;

    // 1. Filter by Category
    if (selectedCategory) {
      filtered = staticData.filter(cat => cat.category === selectedCategory);
    }

    // 2. Smart Search
    if (searchQuery.trim()) {
      const { originalTokens, expandedTokens } = intelligentTokenize(searchQuery);
      const needle = normalizeArabic(searchQuery);

      filtered = filtered
        .map((cat) => ({
          ...cat,
          questions: cat.questions.filter((q) => {
            const searchText = normalizeArabic(`${q.q} ${q.a}`);
            let score = 0;
            let matchedTokens = 0;

            // Original tokens - High Value
            originalTokens.forEach((token: string) => {
              if (searchText.includes(normalizeArabic(token))) {
                matchedTokens++;
                score += 20;
              }
            });

            // Strict Mode: If query has 3+ words, require >60% match ratio
            if (originalTokens.length >= 3) {
              const ratio = matchedTokens / originalTokens.length;
              if (ratio < 0.6) return false;
            } else {
              // Standard Mode: Require at least one original keyword match
              if (matchedTokens === 0) return false;
            }

            // Expanded tokens (synonyms) - Bonus only
            expandedTokens.forEach((term: string) => {
              if (!originalTokens.includes(term) && searchText.includes(normalizeArabic(term))) {
                score += 8;
              }
            });

            // Exact phrase match
            if (searchText.includes(needle)) score += 25;

            return score >= 12;
          }),
        }))
        .filter((cat) => cat.questions.length > 0);
    }

    return filtered;
  }, [staticData, searchQuery, selectedCategory]);

  // Flatten for Pagination
  const flattenedQuestions = useMemo(() => {
    return filteredData.flatMap(cat =>
      cat.questions.map(q => ({ ...q, category: cat.category }))
    );
  }, [filteredData]);

  const totalFilteredCount = flattenedQuestions.length;
  const totalPages = Math.ceil(totalFilteredCount / ITEMS_PER_PAGE);

  const currentQuestions = flattenedQuestions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo">

      {/* 
        Custom Hero Section - "Slightly Different" 
        Differences:
        1. No "Legal Guide" text.
        2. Gradient is more Slate/Emerald focused, less Gold/Cyan.
        3. Background shapes are different (Nebula glow instead of curves).
      */}
      <section className="relative z-[15] bg-slate-900 border-b border-emerald-500/10 pb-12 pt-10 rounded-b-[2.5rem] overflow-hidden shadow-2xl">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s' }} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
          {/* Main Title - ONLY FAQ */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-white to-teal-200 mb-6 drop-shadow-sm">
            الأسئلة الشائعة
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8 font-medium">
            مجتمع تفاعلي يغطي كل جوانب الحياة في تركيا. {totalCount} إجابة موثقة.
          </p>

          {/* Search Box */}
          <div className="relative group max-w-xl mx-auto transform hover:scale-[1.01] transition-transform duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity" />
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-400 transition-colors" size={22} />
              <input
                type="search"
                id="faq-search"
                aria-label="ابحث في الأسئلة الشائعة"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن سؤال... (إقامة، تأمين، جواز...)"
                className="w-full pr-12 pl-4 py-4 rounded-2xl border border-slate-700 bg-slate-800/80 backdrop-blur-xl text-white placeholder:text-slate-500 focus:bg-slate-800 focus:border-emerald-500/50 shadow-xl transition-all outline-none font-bold text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Two-column layout: sidebar + content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar — categories list */}
          <aside className="lg:w-60 xl:w-64 shrink-0">
            {/* Mobile toggle */}
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm font-bold text-sm text-slate-700 dark:text-slate-300 mb-3"
            >
              <span className="flex items-center gap-2">
                <Filter size={16} className="text-emerald-600" />
                {selectedCategory || 'التصنيفات'}
              </span>
              <ChevronDown size={16} className={`transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Category list — always visible on desktop, toggle on mobile */}
            <nav className={`${sidebarOpen ? 'block' : 'hidden'} lg:block lg:sticky lg:top-4`}>
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <h2 className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <Filter size={14} />
                  التصنيفات
                </h2>

                {/* "All" option */}
                <button
                  type="button"
                  onClick={() => { setSelectedCategory(null); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold transition-colors text-right ${
                    !selectedCategory
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-r-[3px] border-emerald-500'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-r-[3px] border-transparent'
                  }`}
                >
                  <HelpCircle size={16} className="shrink-0" />
                  <span className="flex-1">الكل</span>
                  <span className="text-[11px] opacity-60">{totalCount}</span>
                </button>

                {/* All categories from data */}
                {staticData.map((cat) => {
                  const style = CATEGORY_STYLES[cat.category] || DEFAULT_STYLE;
                  const Icon = style.icon;
                  const isActive = selectedCategory === cat.category;
                  return (
                    <button
                      type="button"
                      key={cat.category}
                      onClick={() => { setSelectedCategory(isActive ? null : cat.category); setSidebarOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold transition-colors text-right ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-r-[3px] border-emerald-500'
                          : `text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-r-[3px] border-transparent`
                      }`}
                    >
                      <Icon size={16} className={`shrink-0 ${isActive ? 'text-emerald-500' : style.text}`} />
                      <span className="flex-1 truncate">{cat.category}</span>
                      <span className="text-[11px] opacity-60">{cat.questions.length}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </aside>

          {/* Main Content — questions */}
          <main className="flex-1 min-w-0">
            {/* Active filter indicator */}
            {selectedCategory && (
              <div className="flex items-center gap-2 mb-4 text-sm text-slate-500 dark:text-slate-400">
                <span>التصنيف:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedCategory}</span>
                <span className="opacity-60">({totalFilteredCount} سؤال)</span>
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className="mr-auto text-xs text-red-500 hover:text-red-600 font-bold"
                >
                  إزالة الفلتر
                </button>
              </div>
            )}

            {flattenedQuestions.length === 0 ? (
              <EmptyState
                message={`لا توجد نتائج لـ "${searchQuery}". جرب كلمات مختلفة.`}
              />
            ) : (
              <div className="space-y-4">
                {/* Questions List */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  {currentQuestions.map((q, idx) => (
                    <div key={q.id || idx} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <Accordion
                        items={[{
                          title: q.q,
                          content: (
                            <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed text-right font-medium">
                              {q.a}
                            </div>
                          )
                        }]}
                        defaultOpen={[]}
                        className="border-none shadow-none bg-transparent"
                      />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-3 mt-8">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      aria-label="الصفحة السابقة"
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-2 font-bold text-slate-600 bg-white dark:bg-slate-900 shadow-sm"
                    >
                      <ChevronRight size={18} />
                      السابق
                    </button>

                    <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-mono font-bold text-slate-600 dark:text-slate-300">
                      {currentPage} / {totalPages}
                    </div>

                    <button
                      type="button"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      aria-label="الصفحة التالية"
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-2 font-bold text-slate-600 bg-white dark:bg-slate-900 shadow-sm"
                    >
                      التالي
                      <ChevronRight size={18} className="rotate-180" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
