/**
 * 🔍 البحث العام الذكي (Intelligent Global Search)
 * ===================================================
 *
 * Slim orchestrator — logic lives in useGlobalSearch hook,
 * UI split into SearchSuggestions + SearchResultsDropdown.
 */

'use client';

import { useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGlobalSearch, saveRecentSearch } from '@/hooks/useGlobalSearch';
import { trackSearch, trackSearchResultClick } from '@/lib/analytics';
import type { SearchResult } from '@/lib/searchIndex';
import { PopularSuggestions, AutocompleteSuggestions } from '@/components/search/SearchSuggestions';
import SearchResultsDropdown from '@/components/search/SearchResultsDropdown';
import {
  HERO_ARIA_LABEL,
  HERO_FIELD,
  HERO_FORM,
  HERO_GLOW,
  HERO_ICON_WRAP,
  HERO_PLACEHOLDER,
  HERO_SUBMIT,
  HERO_WRAPPER,
} from '@/components/search/heroSearchStyles';

export default function GlobalSearch({
  variant = 'default',
  autoFocus = false,
  initialQuery = '',
}: {
  variant?: 'default' | 'hero';
  autoFocus?: boolean;
  /** Text the visitor typed into the placeholder field before this component
   *  finished downloading. Carried over so nothing they typed is lost. */
  initialQuery?: string;
}) {
  const {
    query, setQuery, debouncedQuery,
    isOpen, setIsOpen,
    showSuggestions, setShowSuggestions,
    recentSearches, suggestions,
    results, isSearching, refreshRecent,
  } = useGlobalSearch(initialQuery);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const isHero = variant === 'hero';
  const lastTrackedSearch = useRef('');

  // Record the settled search, not each keystroke. Waiting for the remote
  // index prevents a temporary local zero from being reported as a content gap.
  useEffect(() => {
    const normalized = debouncedQuery.trim();
    if (normalized.length < 2) {
      lastTrackedSearch.current = '';
      return;
    }
    if (isSearching || !isOpen || lastTrackedSearch.current === normalized) return;

    // A short quiet window also covers the render in which the remote effect
    // has started but its isSearching state has not painted yet.
    const timer = window.setTimeout(() => {
      if (lastTrackedSearch.current === normalized) return;
      lastTrackedSearch.current = normalized;
      trackSearch(normalized, results.length);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [debouncedQuery, isSearching, isOpen, results.length]);

  // A layout effect, not an effect + rAF: this runs after the DOM is in place
  // but BEFORE the browser paints, so the visitor never sees a frame where the
  // field they were typing in has lost focus. This component only ever arrives
  // through a dynamic import, so it never renders on the server.
  useLayoutEffect(() => {
    if (!autoFocus) return;
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    // Put the caret after the carried-over text, not before it.
    const end = el.value.length;
    try { el.setSelectionRange(end, end); } catch { /* type=search rejects this in some engines */ }
  }, [autoFocus]);

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

  // Global keyboard shortcuts:
  //   "/"            → focus this search (skipped if a text field is already active)
  //   "Cmd+K / Ctrl+K" → same, but always wins
  //   "Escape"       → close suggestions / dropdown
  // Only the non-hero instance owns these shortcuts to avoid double-focus when
  // both the navbar search and the hero search are on screen at the same time.
  useEffect(() => {
    if (isHero) return;
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const inField = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      const cmdK = (e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey);
      if (cmdK) {
        e.preventDefault();
        inputRef.current?.focus();
        setShowSuggestions(true);
        return;
      }
      if (e.key === '/' && !inField) {
        e.preventDefault();
        inputRef.current?.focus();
        setShowSuggestions(true);
        return;
      }
      if (e.key === 'Escape' && (isOpen || showSuggestions)) {
        setIsOpen(false);
        setShowSuggestions(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isHero, isOpen, showSuggestions, setIsOpen, setShowSuggestions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results.length > 0) {
      saveRecentSearch(query.trim());
      refreshRecent();
      trackSearchResultClick(query, results[0], 1, 'submit');
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

  const handleResultClick = useCallback((result: SearchResult, rank: number, action: 'open' | 'map') => {
    trackSearchResultClick(query, result, rank, action);
    setIsOpen(false);
    saveRecentSearch(query.trim());
    refreshRecent();
  }, [setIsOpen, query, refreshRecent]);

  return (
    <div ref={wrapperRef} className={isHero ? HERO_WRAPPER : 'relative mx-auto max-w-3xl md:max-w-3xl lg:max-w-2xl xl:max-w-2xl'}>
      <form role="search" onSubmit={handleSubmit} className={isHero ? HERO_FORM : 'relative transform transition-all duration-300'}>

        {/* Glow Effect for Hero */}
        {isHero && <div className={HERO_GLOW} />}

        <div className={isHero ? HERO_ICON_WRAP : 'absolute inset-y-0 start-4 flex items-center pointer-events-none z-10'}>
          <Search className={isHero ? 'text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors' : 'text-slate-400'} size={isHero ? 22 : 18} />
        </div>

        <input
          ref={inputRef}
          type="search"
          aria-label={isHero ? HERO_ARIA_LABEL : 'بحث عام في الموقع (اضغط / للتركيز)'}
          value={query}
          onChange={(e) => {
            const v = e.target.value;
            setQuery(v);
            setShowSuggestions(true);
            if (!v.trim()) setIsOpen(false);
          }}
          onFocus={() => { setShowSuggestions(true); if (debouncedQuery.trim().length >= 2) setIsOpen(true); }}
          placeholder={isHero ? HERO_PLACEHOLDER : 'ابحث بأي صيغة... (ضيعت كملك، فقدت جواز، بسبور ضاع...)'}
          autoFocus={false}
          className={isHero
            ? HERO_FIELD
            : 'w-full transition-all outline-none border-0 appearance-none py-4 md:py-5 ps-11 md:ps-12 pe-16 rounded-2xl text-sm md:text-base shadow-sm focus:ring-4 focus:ring-accent-500/50 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-xs md:placeholder:text-sm placeholder:text-slate-400 dark:placeholder:text-slate-400'
          }
        />

        {/* Hero Search Button */}
        {isHero && (
          <button type="submit" aria-label="بحث" className={HERO_SUBMIT}>
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

      {/* Screen reader announcement for search results */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {isOpen && results.length > 0 && `تم العثور على ${results.length} نتيجة`}
        {isOpen && results.length === 0 && query.length > 0 && 'لا توجد نتائج'}
      </div>

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
    </div>
  );
}
