'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
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

type GlobalSearchModule = typeof import('@/components/GlobalSearch');
type GlobalSearchComponent = GlobalSearchModule['default'];

/**
 * The homepage search field, without the wait.
 *
 * The search logic is heavy — the Supabase client, the tokenizer, the synonym
 * table — so it stays out of the homepage's first load. What changed is HOW it
 * arrives. This used to render a <button>; clicking it started the download,
 * showed a third, differently-sized placeholder, and only then handed over a
 * usable field. The owner saw the box freeze, blink, change shape, and finally
 * accept typing about a second later.
 *
 * Now:
 *   • the placeholder is a real <input> — focusable and typeable from the
 *     first paint, wearing the exact classes the real field wears;
 *   • the chunk is fetched during idle time, long before anyone clicks;
 *   • the swap happens only once the module has actually arrived, so there is
 *     no intermediate loading state to flash;
 *   • anything typed in the meantime is carried across, caret at the end.
 *
 * On the usual path the swap lands while the page is still idle and nobody
 * ever sees it happen.
 */
export default function LazyGlobalSearch() {
  const [GlobalSearch, setGlobalSearch] = useState<GlobalSearchComponent | null>(null);

  // What the visitor typed before the real component was ready.
  const buffered = useRef('');
  // Whether they had engaged with the field, so we know to restore focus.
  const engaged = useRef(false);
  const loading = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    if (loading.current) return;
    loading.current = true;
    import('@/components/GlobalSearch')
      .then((m) => setGlobalSearch(() => m.default))
      .catch(() => {
        // Let a later interaction retry rather than stranding the field.
        loading.current = false;
      });
  }, []);

  // Fetch while the browser is idle. requestIdleCallback is absent on Safari,
  // where a short timeout keeps the behaviour the same.
  useEffect(() => {
    const ric = (window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    }).requestIdleCallback;
    if (ric) {
      const id = ric(load, { timeout: 2500 });
      return () => (window as unknown as { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback?.(id);
    }
    const t = setTimeout(load, 1200);
    return () => clearTimeout(t);
  }, [load]);

  // This field is server-rendered, so someone can start typing into it before
  // React has hydrated — and `onChange` cannot have fired yet, so the buffer
  // is still empty. Without this, the real field (which is controlled) would
  // mount with an empty value and wipe what they wrote. On a slow phone that
  // window is seconds wide.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    if (el.value) {
      buffered.current = el.value;
      engaged.current = true;
      load();
    } else if (document.activeElement === el) {
      engaged.current = true;
      load();
    }
  }, [load]);

  if (GlobalSearch) {
    return (
      <GlobalSearch
        variant="hero"
        autoFocus={engaged.current}
        initialQuery={buffered.current}
      />
    );
  }

  return (
    <div className={HERO_WRAPPER}>
      <form
        role="search"
        className={HERO_FORM}
        onSubmit={(e) => {
          // Nothing can be searched until the logic lands; keep the page put.
          e.preventDefault();
          engaged.current = true;
          load();
        }}
      >
        <div className={HERO_GLOW} />

        <div className={HERO_ICON_WRAP}>
          <Search
            className="text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"
            size={22}
          />
        </div>

        <input
          ref={inputRef}
          type="search"
          aria-label={HERO_ARIA_LABEL}
          placeholder={HERO_PLACEHOLDER}
          defaultValue={buffered.current}
          onFocus={() => { engaged.current = true; load(); }}
          onPointerEnter={load}
          onTouchStart={load}
          onChange={(e) => { buffered.current = e.target.value; engaged.current = true; load(); }}
          className={HERO_FIELD}
        />

        <button type="submit" aria-label="بحث" className={HERO_SUBMIT}>
          بحث
        </button>
      </form>
    </div>
  );
}
