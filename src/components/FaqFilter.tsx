'use client';

import { useEffect, useRef, useState } from 'react';
import HeroSearchInput from '@/components/HeroSearchInput';
import { normalizeArabic } from '@/lib/arabicSearch';
import { faqCountLabel } from '@/lib/faqSections';

/*
 * /faq search island — the whole question list is SERVER-rendered (SEO: every
 * answer in the HTML). This island never owns that list; it filters the DOM
 * in place by toggling `hidden` on `details[data-faq]` and their sections.
 * That keeps hydration to one input instead of 470+ nodes.
 *
 * Behaviour: AND-match of normalized tokens over question+answer text.
 * While a query is active, matching items are OPENED so the answer itself is
 * visible (nothing hidden behind a second tap); clearing the query closes
 * everything back. The section-anchor nav is hidden during search — anchors
 * into hidden sections would be dead links.
 */

export default function FaqFilter({ total }: { total: number }) {
  const [query, setQuery] = useState('');
  const [shown, setShown] = useState(total);
  const index = useRef<{ el: HTMLDetailsElement; text: string }[] | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Deep link (?q=…) read in the browser on purpose: reading searchParams on
  // the server forced the whole route dynamic (verified live on the old page —
  // `no-store`, revalidate never engaged).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q');
    if (q) setQuery(q);
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!index.current) {
        index.current = Array.from(
          document.querySelectorAll<HTMLDetailsElement>('details[data-faq]')
        ).map((el) => ({ el, text: normalizeArabic(el.textContent || '') }));
      }
      const tokens = normalizeArabic(query.trim()).split(/\s+/).filter(Boolean);
      const searching = tokens.length > 0;
      let visible = 0;
      for (const { el, text } of index.current) {
        const match = !searching || tokens.every((t) => text.includes(t));
        el.hidden = !match;
        el.open = searching && match;
        if (match) visible++;
      }
      for (const sec of document.querySelectorAll<HTMLElement>('[data-faq-section]')) {
        sec.hidden = !sec.querySelector('details[data-faq]:not([hidden])');
      }
      const nav = document.getElementById('faq-nav');
      if (nav) nav.hidden = searching;
      setShown(visible);
    }, 120);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  return (
    <div>
      <HeroSearchInput
        value={query}
        onChange={setQuery}
        placeholder="ابحث في الأسئلة… (إقامة، كملك، تأمين، إيجار)"
      />
      {query.trim() && (
        <p
          className="mt-3 text-sm font-bold text-center text-emerald-700 dark:text-emerald-300"
          role="status"
        >
          {shown > 0
            ? `${faqCountLabel(shown)} — الأجوبة مفتوحة تحت مباشرة`
            : 'لا نتائج بهذه الكلمات — جرّب كلمة أوسع أو أقل'}
        </p>
      )}
    </div>
  );
}
