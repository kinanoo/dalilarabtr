/**
 * 🔍 البحث العام الذكي (Intelligent Global Search)
 * ===================================================
 *
 * Slim orchestrator — logic lives in useGlobalSearch hook,
 * UI split into SearchSuggestions + SearchResultsDropdown.
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { useGlobalSearch, saveRecentSearch, getRecentSearches } from '@/hooks/useGlobalSearch';
import { PopularSuggestions, AutocompleteSuggestions } from '@/components/search/SearchSuggestions';
import SearchResultsDropdown from '@/components/search/SearchResultsDropdown';

export default function GlobalSearch({ variant = 'default' }: { variant?: 'default' | 'hero' }) {
  const {
    query, setQuery, debouncedQuery,
    isOpen, setIsOpen,
    showSuggestions, setShowSuggestions,
    recentSearches, suggestions,
    results, isSearching, refreshRecent,
  } = useGlobalSearch();

  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const isHero = variant === 'hero';

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsOpen, setShowSuggestions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results.length > 0) {
      saveRecentSearch(query.trim());
      refreshRecent();
      router.push(results[0].url);
      setIsOpen(false);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = useCallback((text: string) => {
    setQuery(text);
    setIsOpen(true);
    setShowSuggestions(false);
    saveRecentSearch(text);
    refreshRecent();
  }, [setQuery, setIsOpen, setShowSuggestions, refreshRecent]);

  const handleResultClick = useCallback(() => {
    setIsOpen(false);
    saveRecentSearch(query.trim());
    refreshRecent();
  }, [setIsOpen, query, refreshRecent]);

  return (
    <div ref={wrapperRef} className={`relative mx-auto ${isHero ? 'max-w-xl' : 'max-w-3xl md:max-w-3xl lg:max-w-2xl xl:max-w-2xl'}`}>
      <form role="search" onSubmit={handleSubmit} className={`relative transform transition-all duration-300 ${isHero ? 'group' : ''}`}>

        {/* Glow Effect for Hero */}
        {isHero && (
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-500" />
        )}

        <div className="absolute inset-y-0 start-4 flex items-center pointer-events-none z-10">
          <Search className={isHero ? 'text-slate-400 group-hover:text-emerald-400 transition-colors' : 'text-slate-400'} size={isHero ? 22 : 18} />
        </div>

        <input
          type="search"
          aria-label="بحث عام في الموقع"
          value={query}
          onChange={(e) => {
            const v = e.target.value;
            setQuery(v);
            setShowSuggestions(true);
            if (!v.trim()) setIsOpen(false);
          }}
          onFocus={() => { setShowSuggestions(true); if (debouncedQuery.trim().length >= 2) setIsOpen(true); }}
          placeholder={isHero ? 'ماذا تريد أن تعرف اليوم؟ (إقامة، قانون...)' : 'ابحث بأي صيغة... (ضيعت كملك، فقدت جواز، بسبور ضاع...)'}
          autoFocus={false}
          className={`
            w-full transition-all outline-none border-0
            ${isHero
              ? 'py-4 ps-12 pe-24 rounded-full bg-slate-900/80 backdrop-blur-2xl text-white placeholder:text-slate-500 text-lg shadow-2xl ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500/60 focus:shadow-[0_0_20px_4px_rgba(16,185,129,0.15)] relative z-10'
              : 'py-4 md:py-5 ps-11 md:ps-12 pe-16 rounded-2xl text-sm md:text-base shadow-sm focus:ring-4 focus:ring-accent-500/50 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-xs md:placeholder:text-sm placeholder:text-slate-400 dark:placeholder:text-slate-400'
            }
          `}
        />

        {/* Hero Search Button */}
        {isHero && (
          <button
            type="submit"
            aria-label="بحث"
            className="absolute inset-y-1.5 end-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white px-6 rounded-full font-bold shadow-lg transform active:scale-95 transition-all z-20 flex items-center justify-center"
          >
            بحث
          </button>
        )}

        {!isHero && query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setIsOpen(false); setShowSuggestions(false); }}
            className="absolute inset-y-0 end-4 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            مسح
          </button>
        )}
      </form>

      <AnimatePresence>
        {/* Popular + Recent (no query, input focused) */}
        {showSuggestions && !isOpen && query.length === 0 && (
          <PopularSuggestions recentSearches={recentSearches} onSuggestionClick={handleSuggestionClick} />
        )}

        {/* Autocomplete (typing, before results) */}
        {showSuggestions && query.length >= 1 && suggestions.length > 0 && !isOpen && (
          <AutocompleteSuggestions suggestions={suggestions} onSuggestionClick={handleSuggestionClick} />
        )}

        {/* Search Results */}
        {isOpen && (results.length > 0 || query.length > 0) && (
          <SearchResultsDropdown results={results} query={query} isSearching={isSearching} onResultClick={handleResultClick} />
        )}
      </AnimatePresence>
    </div>
  );
}
