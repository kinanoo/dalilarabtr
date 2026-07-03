'use client';

import { useState, useMemo, useEffect } from 'react';
import { ChevronRight, ChevronDown, Home, Briefcase, GraduationCap, Plane, Building2, Stethoscope, Shield, Scale, FileText, HelpCircle, MapPin, Wallet } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import PageHero from '@/components/PageHero';
import HeroSearchInput from '@/components/HeroSearchInput';
import { FAQCategory } from '@/lib/faq-types';
import { intelligentTokenize } from '@/lib/intelligentSearch';
import { normalizeArabic } from '@/lib/arabicSearch';

/*
 * 2026-07 redesign — brought in line with the site's new design language
 * (codes/services/homepage): the old page had its own dark slate hero with
 * nebula glows + a desktop sidebar that collapsed into a toggle on mobile.
 * Now: the shared light PageHero + hero search, and the categories are
 * compact WRAPPING pills with icon + count (no sidebar, no toggle, nothing
 * to drag). Search/pagination logic untouched.
 */

// Category visual config — icon + accent for known categories
const CATEGORY_STYLES: Record<string, { icon: typeof Home; text: string }> = {
  'الإقامة في تركيا': { icon: Home, text: 'text-blue-600 dark:text-blue-400' },
  'الكملك': { icon: Shield, text: 'text-red-600 dark:text-red-400' },
  'إذن العمل': { icon: Briefcase, text: 'text-amber-600 dark:text-amber-400' },
  'التعليم': { icon: GraduationCap, text: 'text-violet-600 dark:text-violet-400' },
  'الصحة والتأمين': { icon: Stethoscope, text: 'text-teal-600 dark:text-teal-400' },
  'السفر والتأشيرات': { icon: Plane, text: 'text-cyan-600 dark:text-cyan-400' },
  'القنصلية': { icon: Building2, text: 'text-indigo-600 dark:text-indigo-400' },
  'الشؤون القانونية': { icon: Scale, text: 'text-orange-600 dark:text-orange-400' },
  'الجنسية التركية': { icon: FileText, text: 'text-emerald-600 dark:text-emerald-400' },
  'السكن': { icon: MapPin, text: 'text-pink-600 dark:text-pink-400' },
  'المالية والضرائب': { icon: Wallet, text: 'text-lime-600 dark:text-lime-400' },
};

const DEFAULT_STYLE = { icon: HelpCircle, text: 'text-slate-500 dark:text-slate-400' };

interface FAQClientProps {
  staticData: FAQCategory[];
  totalCount: number;
  // Deep-link query (?q=…) — read on the SERVER and passed down. Using
  // useSearchParams here bailed the whole page out to client rendering:
  // crawlers saw only the Suspense fallback instead of 600+ questions.
  initialQuery?: string;
}

const ITEMS_PER_PAGE = 15;

export default function FAQClientNew({ staticData, totalCount, initialQuery = '' }: FAQClientProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null);

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

            // Require all tokens to match for 2+ word queries
            if (originalTokens.length >= 2) {
              if (matchedTokens < originalTokens.length) return false;
            } else {
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
      <PageHero
        title="الأسئلة الشائعة"
        description={`${totalCount} إجابة موثّقة تغطي جوانب الحياة في تركيا`}
        icon={<HelpCircle className="w-10 h-10 md:w-12 md:h-12 text-emerald-600 dark:text-emerald-300" />}
      >
        <HeroSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="ابحث عن سؤال... (إقامة، تأمين، جواز...)"
        />
      </PageHero>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Category pills — wrapping, no sidebar, no side-scroll */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            aria-pressed={!selectedCategory}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm font-bold transition-all ${
              !selectedCategory
                ? 'border-emerald-500 bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-emerald-300 dark:hover:border-emerald-700'
            }`}
          >
            الكل
            <span className={`text-[10px] font-bold ${!selectedCategory ? 'text-emerald-100' : 'text-slate-400'}`}>{totalCount}</span>
          </button>
          {staticData.map((cat) => {
            const style = CATEGORY_STYLES[cat.category] || DEFAULT_STYLE;
            const Icon = style.icon;
            const isActive = selectedCategory === cat.category;
            return (
              <button
                type="button"
                key={cat.category}
                onClick={() => setSelectedCategory(isActive ? null : cat.category)}
                aria-pressed={isActive}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm font-bold transition-all ${
                  isActive
                    ? 'border-emerald-500 bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-emerald-300 dark:hover:border-emerald-700'
                }`}
              >
                <Icon size={15} className={isActive ? 'text-white' : style.text} />
                <span className="max-w-[9rem] truncate">{cat.category}</span>
                <span className={`text-[10px] font-bold ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>{cat.questions.length}</span>
              </button>
            );
          })}
        </div>

        {flattenedQuestions.length === 0 ? (
          <EmptyState
            message={`لا توجد نتائج لـ "${searchQuery}". جرب كلمات مختلفة.`}
          />
        ) : (
          <div className="space-y-4">
            {/* Results count while filtering */}
            {(selectedCategory || searchQuery.trim()) && (
              <p className="text-xs font-bold text-slate-400">
                {totalFilteredCount} سؤال{selectedCategory ? ` · ${selectedCategory}` : ''}
              </p>
            )}

            {/* Questions List */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              {currentQuestions.map((q, idx) => {
                const qId = q.id || `q-${idx}`;
                const isOpen = openQuestionId === qId;
                const style = CATEGORY_STYLES[q.category] || DEFAULT_STYLE;
                const Icon = style.icon;
                return (
                  <div key={qId} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <button
                      type="button"
                      onClick={() => setOpenQuestionId(isOpen ? null : qId)}
                      className="w-full flex items-center gap-3 p-4 sm:p-5 text-start hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors"
                      aria-expanded={isOpen ? 'true' : 'false'}
                    >
                      <Icon size={16} className={`shrink-0 ${style.text}`} aria-hidden="true" />
                      <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex-1">
                        {q.q}
                      </h3>
                      <ChevronDown
                        size={20}
                        className={`text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
                    >
                      <div className="px-4 sm:px-5 pb-4 sm:pb-5 prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed text-start font-medium">
                        {q.a}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="الصفحة السابقة"
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 disabled:opacity-50 transition-all flex items-center gap-2 font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 shadow-sm"
                >
                  <ChevronRight size={18} />
                  السابق
                </button>

                <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-mono font-bold text-slate-600 dark:text-slate-300" dir="ltr">
                  {currentPage} / {totalPages}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="الصفحة التالية"
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 disabled:opacity-50 transition-all flex items-center gap-2 font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 shadow-sm"
                >
                  التالي
                  <ChevronRight size={18} className="rotate-180" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
