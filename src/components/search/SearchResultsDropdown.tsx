/**
 * 📋 Search Results Dropdown
 * ===========================
 * Displays search results in a dropdown with icons and type badges.
 */

'use client';

import Link from 'next/link';
import { Search, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { SearchResult } from '@/lib/searchIndex';

type SearchResultsDropdownProps = {
  results: SearchResult[];
  query: string;
  isSearching: boolean;
  onResultClick: () => void;
};

export default function SearchResultsDropdown({
  results,
  query,
  isSearching,
  onResultClick,
}: SearchResultsDropdownProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      role="listbox"
      aria-label="نتائج البحث"
      aria-live="polite"
      className="absolute top-full mt-4 z-[200] w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden max-h-[60vh] overflow-y-auto"
    >
      {results.length > 0 ? (
        <div className="py-2">
          {isSearching && (
            <div className="px-4 py-2 text-xs text-center text-emerald-500 animate-pulse">
              جاري البحث في قاعدة البيانات...
            </div>
          )}
          <div className="px-4 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">✅</span>
              {results.length} نتيجة مطابقة
            </div>
          </div>
          {results.map((result) => (
            <Link
              key={result.id}
              href={result.url}
              onClick={onResultClick}
              role="option"
              aria-label={`${result.title} — ${result.type}`}
              className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0 group"
            >
              <div className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 p-2 rounded-lg group-hover:bg-emerald-100 group-hover:text-emerald-600 transition">
                <result.icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-700 truncate">
                  {result.title}
                </h4>
                <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full inline-block mt-1">
                  {result.type}
                </span>
              </div>
              <ArrowLeft
                size={16}
                className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 flex-shrink-0"
              />
            </Link>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center text-slate-500 dark:text-slate-300">
          <Search size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="font-bold mb-2">لا توجد نتائج مطابقة لـ &quot;{query}&quot;</p>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            💡 <strong>نصيحة:</strong> جرب كلمات أساسية:
            <br />
            إقامة، جواز، كملك، تأمين، ترجمة
          </p>
        </div>
      )}
    </motion.div>
  );
}
