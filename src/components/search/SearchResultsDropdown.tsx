/**
 * 📋 Search Results Dropdown
 * ===========================
 * Displays search results in a dropdown with icons and type badges.
 */

'use client';

import Link from 'next/link';
import { Search, ArrowLeft, MapPin } from 'lucide-react';
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
    // Height is capped just below a whole number of rows so the next result is
    // half-visible at the bottom edge. That sliver is the only cue telling a
    // visitor the list continues — with tall rows and no cue, people took the
    // first screenful for the whole list and never scrolled.
    <div
      role="listbox"
      aria-label="نتائج البحث"
      aria-live="polite"
      className="absolute top-full mt-3 z-[200] w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden max-h-[min(52vh,19rem)] overflow-y-auto overscroll-contain"
    >
      {results.length > 0 ? (
        <div>
          {/* Sticky so the count stays readable while scrolling the list. */}
          <div className="sticky top-0 z-10 px-3 py-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between gap-2">
            <span>{results.length} نتيجة — الأقرب أولاً</span>
            {isSearching && <span className="font-normal animate-pulse">جارٍ البحث…</span>}
          </div>
          {results.map((result, i) => (
            <div
              key={result.id}
              className="flex items-stretch border-b border-slate-100 dark:border-slate-800 last:border-0"
            >
              <Link
                href={result.url}
                onClick={onResultClick}
                role="option"
                aria-label={`${result.title} — ${result.type}`}
                className="flex flex-1 min-w-0 items-center gap-2.5 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
              >
                {/* The top hit is what the visitor almost always wants — mark it. */}
                <div
                  className={`shrink-0 p-1.5 rounded-lg transition ${i === 0
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 group-hover:bg-emerald-100 group-hover:text-emerald-600'}`}
                >
                  <result.icon size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  {/* Title and type share one line: two lines per row doubled the
                      height and pushed everything past the fold. */}
                  <div className="flex items-baseline gap-2">
                    <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 truncate leading-snug">
                      {result.title}
                    </h4>
                    <span className="shrink-0 text-[10px] text-slate-400 dark:text-slate-500">
                      {result.type}
                    </span>
                  </div>
                  {/* The ONE exception to the single-line rule: «موقع رسمي» rows
                      carry a verified street address, and the address IS the
                      answer to "where is it" — worth ~12px on those rows only,
                      at a size that does not re-tall the whole list. */}
                  {result.mapUrl && result.desc && (
                    <p className="text-[10px] leading-tight text-slate-500 dark:text-slate-400 truncate" dir="ltr" lang="tr">
                      {result.desc}
                    </p>
                  )}
                </div>
                <ArrowLeft
                  size={13}
                  className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 shrink-0"
                />
              </Link>

              {/* «موقع رسمي» results carry a live Maps link — offer it right
                  here so «وين القنصلية السورية؟» is one tap from the search
                  box to navigation, without opening the page first. */}
              {result.mapUrl && (
                <a
                  href={result.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onResultClick}
                  aria-label={`افتح موقع ${result.title} على خرائط جوجل`}
                  title="افتح على خرائط جوجل"
                  className="flex items-center gap-1 px-2.5 sm:px-3 border-s border-slate-100 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors shrink-0"
                >
                  <MapPin size={15} />
                  <span className="hidden sm:inline text-[10px] font-black">خرائط</span>
                </a>
              )}
            </div>
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
    </div>
  );
}
