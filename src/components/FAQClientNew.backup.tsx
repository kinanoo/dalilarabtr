'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, ChevronDown, ChevronRight, Menu, X, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import Accordion from '@/components/ui/Accordion';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import { FAQCategory } from '@/lib/faq-types';
import { intelligentTokenize } from '@/lib/intelligentSearch';
import { normalizeArabic } from '@/lib/arabicSearch';

interface FAQClientProps {
  staticData: FAQCategory[];
  totalCount: number;
}

const ITEMS_PER_PAGE = 15;

export default function FAQClientNew({ staticData, totalCount }: FAQClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            let hasOriginalKeyword = false;

            // Original tokens
            originalTokens.forEach((token: string) => {
              if (searchText.includes(normalizeArabic(token))) {
                hasOriginalKeyword = true;
                score += 20;
              }
            });

            if (!hasOriginalKeyword) return false;

            // Expanded tokens (synonyms)
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <PageHeader
        title="الأسئلة الشائعة"
        description={`دليلك الشامل: ${totalCount} سؤال وجواب تغطي كافة جوانب المعيشة في تركيا`}
        icon={<Search size={32} />}
        breadcrumbs={[{ label: 'الأسئلة الشائعة', href: '/faq' }]}
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar / Mobile Filter */}
          <aside className="lg:w-1/4 shrink-0">
            <div className="sticky top-24 space-y-6">

              {/* Search Box */}
              <div className="relative group">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن إجابة..."
                  className="w-full pr-12 pl-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-medium"
                />
              </div>

              {/* Categories (Desktop) */}
              <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-sm">
                <div className="p-3 border-b border-slate-100 dark:border-slate-800 mb-2">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Filter size={18} /> التصنيفات
                  </h3>
                </div>
                <div className="space-y-1 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full text-right px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex justify-between items-center ${selectedCategory === null
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/10 dark:text-emerald-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                  >
                    <span>الكل</span>
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-xs">{totalCount}</span>
                  </button>
                  {staticData.map((cat) => (
                    <button
                      key={cat.category}
                      onClick={() => setSelectedCategory(cat.category)}
                      className={`w-full text-right px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex justify-between items-center ${selectedCategory === cat.category
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/10 dark:text-emerald-400 font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                      <span className="truncate ml-2">{cat.category}</span>
                      <span className="text-xs opacity-60">({cat.questions.length})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories (Mobile via Horizontal Scroll) */}
              <div className="lg:hidden">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold border transition-all ${selectedCategory === null
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                  >
                    الكل
                  </button>
                  {staticData.map((cat) => (
                    <button
                      key={cat.category}
                      onClick={() => setSelectedCategory(cat.category)}
                      className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium border transition-all ${selectedCategory === cat.category
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      {cat.category}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
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
                            <div className="space-y-2">
                              <div className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 w-fit px-2 py-1 rounded text-right mb-2">
                                {q.category}
                              </div>
                              <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed text-right">
                                {q.a}
                              </div>
                            </div>
                          )
                        }]}
                        className="border-none shadow-none bg-transparent"
                      />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8 py-4">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                    >
                      <ChevronRight size={20} className="rtl:rotate-180" />
                    </button>

                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400 px-4">
                      صفحة {currentPage} من {totalPages}
                    </span>

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                    >
                      <ChevronRight size={20} className="ltr:rotate-180" />
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
