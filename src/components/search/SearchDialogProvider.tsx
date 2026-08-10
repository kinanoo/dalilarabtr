'use client';

import dynamic from 'next/dynamic';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Search, X } from 'lucide-react';

const GlobalSearch = dynamic(() => import('@/components/GlobalSearch'), {
  ssr: false,
  loading: () => (
    <div className="mt-4 h-28 animate-pulse rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800" />
  ),
});

type SearchDialogContextValue = {
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
};

const SearchDialogContext = createContext<SearchDialogContextValue | null>(null);

export function useSearchDialog() {
  const value = useContext(SearchDialogContext);
  if (!value) throw new Error('useSearchDialog must be used inside SearchDialogProvider');
  return value;
}

function isTextEntryTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  return Boolean(
    element &&
    (element.tagName === 'INPUT' ||
      element.tagName === 'TEXTAREA' ||
      element.tagName === 'SELECT' ||
      element.isContentEditable),
  );
}

export default function SearchDialogProvider({ children }: { children: ReactNode }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const openSearch = useCallback(() => {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    setIsSearchOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    window.setTimeout(() => returnFocusRef.current?.focus(), 0);
  }, []);

  // The same controller serves the header button, the hero button and the
  // familiar keyboard shortcuts. Only one search index is ever mounted.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const commandSearch = (event.key === 'k' || event.key === 'K') && (event.ctrlKey || event.metaKey);
      const slashSearch = event.key === '/' && !isTextEntryTarget(event.target);

      if (!isSearchOpen && (commandSearch || slashSearch)) {
        event.preventDefault();
        openSearch();
        return;
      }

      if (!isSearchOpen) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeSearch();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) || [],
      ).filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [closeSearch, isSearchOpen, openSearch]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isSearchOpen]);

  return (
    <SearchDialogContext.Provider value={{ isSearchOpen, openSearch, closeSearch }}>
      {children}

      {isSearchOpen && (
        <div
          className="fixed inset-0 z-[300] flex items-stretch justify-center bg-slate-950/60 sm:items-start sm:px-4 sm:pt-[9vh]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeSearch();
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="site-search-title"
            dir="rtl"
            className="flex h-[100dvh] w-full flex-col overflow-hidden bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] text-slate-900 shadow-2xl dark:bg-slate-950 dark:text-white sm:h-auto sm:max-h-[78dvh] sm:max-w-3xl sm:rounded-lg sm:border sm:border-slate-200 sm:p-5 dark:sm:border-slate-700"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  <Search size={19} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 id="site-search-title" className="text-base font-black sm:text-lg">ابحث في دليل العرب</h2>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">مقال، خدمة، أداة، منطقة أو جهة رسمية</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeSearch}
                aria-label="إغلاق البحث"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-rose-800 dark:hover:bg-rose-950/30 dark:hover:text-rose-300"
              >
                <X size={21} aria-hidden="true" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pt-4">
              <GlobalSearch variant="dialog" autoFocus onNavigate={closeSearch} />
            </div>
          </div>
        </div>
      )}
    </SearchDialogContext.Provider>
  );
}
