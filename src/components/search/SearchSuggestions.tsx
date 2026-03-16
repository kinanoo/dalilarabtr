/**
 * 💡 Search Suggestions Dropdown
 * ===============================
 * Shows popular searches, recent searches, and autocomplete suggestions.
 */

'use client';

import { Search, ArrowLeft, TrendingUp, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { POPULAR_SEARCHES } from '@/hooks/useGlobalSearch';

type SearchSuggestionsProps = {
  recentSearches: string[];
  suggestions: { title: string; url: string }[];
  query: string;
  isOpen: boolean;
  onSuggestionClick: (text: string) => void;
};

const dropdownAnimation = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

/** Popular & Recent searches (shown when input focused, no query) */
export function PopularSuggestions({
  recentSearches,
  onSuggestionClick,
}: Pick<SearchSuggestionsProps, 'recentSearches' | 'onSuggestionClick'>) {
  return (
    <motion.div
      {...dropdownAnimation}
      className="absolute top-full mt-4 z-[200] w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden"
    >
      {/* Recent searches */}
      {recentSearches.length > 0 && (
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 mb-3">
            <Clock size={13} />
            <span>عمليات بحث سابقة</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => onSuggestionClick(term)}
                className="text-sm px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400 transition-colors font-medium"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popular searches */}
      <div
        className={`px-4 pb-4 ${
          recentSearches.length > 0 ? 'pt-3 border-t border-slate-100 dark:border-slate-800 mt-2' : 'pt-4'
        }`}
      >
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 mb-3">
          <TrendingUp size={13} />
          <span>الأكثر بحثاً</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {POPULAR_SEARCHES.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => onSuggestionClick(term)}
              className="text-sm px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors font-medium border border-emerald-100 dark:border-emerald-900/30"
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/** Autocomplete suggestions (shown while typing, before results) */
export function AutocompleteSuggestions({
  suggestions,
  onSuggestionClick,
}: Pick<SearchSuggestionsProps, 'suggestions' | 'onSuggestionClick'>) {
  return (
    <motion.div
      {...dropdownAnimation}
      className="absolute top-full mt-4 z-[200] w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden"
    >
      <div className="py-1">
        {suggestions.map((s) => (
          <button
            key={s.url}
            type="button"
            onClick={() => onSuggestionClick(s.title)}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-right"
          >
            <Search size={14} className="text-slate-300 dark:text-slate-600 shrink-0" />
            <span className="text-sm text-slate-700 dark:text-slate-200 font-medium truncate">{s.title}</span>
            <ArrowLeft size={14} className="text-slate-300 dark:text-slate-600 mr-auto shrink-0" />
          </button>
        ))}
      </div>
    </motion.div>
  );
}
