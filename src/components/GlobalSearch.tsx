'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Search, FileText, Bell, ArrowLeft, File, Briefcase, BrainCircuit } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ARTICLES } from '@/lib/articles';
import { SERVICES_LIST, FORMS, LATEST_UPDATES } from '@/lib/data';
import { CONSULTANT_SCENARIOS } from '@/lib/consultant-data';
import { minTokenMatches, normalizeArabic, scoreMatch, tokenizeArabicQuery } from '@/lib/arabicSearch';

type SearchResult = {
  id: string | number;
  title: string;
  type: string;
  url: string;
  icon: LucideIcon;
  desc?: string;
};

type SearchIndexItem = {
  id: string;
  title: string;
  type: string;
  url: string;
  icon: LucideIcon;
  desc?: string;
  haystack: string;
};

function extractArticleIdFromLink(link?: string): string {
  const raw = (link || '').trim();
  if (!raw.startsWith('/article/')) return '';
  const after = raw.slice('/article/'.length);
  const clean = after.split(/[?#]/)[0] || '';
  try {
    return decodeURIComponent(clean).trim();
  } catch {
    return clean.trim();
  }
}

const ARTICLE_INDEX: SearchIndexItem[] = Object.entries(ARTICLES).map(([slug, data]) => {
  const raw = [
    data.title,
    data.intro,
    data.details,
    ...(data.documents || []),
    ...(data.steps || []),
    ...(data.tips || []),
    data.fees || '',
    data.warning || '',
  ]
    .filter(Boolean)
    .join(' ');

  return {
    id: `art-${slug}`,
    title: data.title,
    type: 'مقال',
    url: `/article/${slug}`,
    icon: FileText,
    haystack: normalizeArabic(raw),
  };
});

const SERVICE_INDEX: SearchIndexItem[] = SERVICES_LIST.map((service) => ({
  id: `srv-${service.id}`,
  title: service.title,
  type: 'خدمة',
  url: `/request?service=${service.id}`,
  icon: Briefcase,
  desc: service.desc,
  haystack: normalizeArabic(`${service.title} ${service.desc}`),
}));

const CONSULTANT_INDEX: SearchIndexItem[] = Object.entries(CONSULTANT_SCENARIOS).map(([key, value]) => {
  const articleId = (value.articleId || '').trim() || extractArticleIdFromLink(value.link);
  const article = articleId ? ARTICLES[articleId] : undefined;

  const desc = article?.intro?.trim() ? article.intro : value.desc;
  const articleText = article
    ? [
        article.title,
        article.intro,
        article.details,
        ...(article.documents || []),
        ...(article.steps || []),
        ...(article.tips || []),
        article.fees || '',
        article.warning || '',
      ]
        .filter(Boolean)
        .join(' ')
    : '';

  return {
    id: `consult-${key}`,
    title: value.title,
    type: 'استشارة ذكية',
    url: `/consultant?scenario=${encodeURIComponent(key)}`,
    icon: BrainCircuit,
    desc,
    haystack: normalizeArabic(`${value.title} ${desc || ''} ${value.legal || ''} ${articleText}`),
  };
});

const FORMS_INDEX: SearchIndexItem[] = FORMS.map((form, idx) => ({
  id: `form-${idx}`,
  title: form.name,
  type: 'نموذج',
  url: '/forms',
  icon: File,
  haystack: normalizeArabic(form.name),
}));

const UPDATES_INDEX: SearchIndexItem[] = LATEST_UPDATES.map((update) => ({
  id: `upd-${update.id}`,
  title: update.title,
  type: 'خبر',
  url: `/updates#upd-${update.id}`,
  icon: Bell,
  haystack: normalizeArabic(update.title),
}));

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedQuery(query), 120);
    return () => window.clearTimeout(handle);
  }, [query]);

  const results = useMemo((): SearchResult[] => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length === 0) return [];

    const tokens = tokenizeArabicQuery(trimmed);
    const needle = normalizeArabic(trimmed);
    const minMatched = minTokenMatches(tokens);

    const scored: Array<SearchResult & { _score: number }> = [];

    const maybeAdd = (item: SearchIndexItem) => {
      // If user typed a full sentence and tokenization yields nothing (rare), fall back to phrase includes.
      if (tokens.length === 0) {
        if (!needle) return;
        if (!item.haystack.includes(needle)) return;
        scored.push({
          id: item.id,
          title: item.title,
          type: item.type,
          desc: item.desc,
          url: item.url,
          icon: item.icon,
          _score: 10,
        });
        return;
      }

      const { score, matched } = scoreMatch(item.haystack, item.title, tokens);
      if (matched < minMatched) return;
      scored.push({
        id: item.id,
        title: item.title,
        type: item.type,
        desc: item.desc,
        url: item.url,
        icon: item.icon,
        _score: score,
      });
    };

    for (const item of CONSULTANT_INDEX) maybeAdd(item);
    for (const item of ARTICLE_INDEX) maybeAdd(item);
    for (const item of SERVICE_INDEX) maybeAdd(item);
    for (const item of FORMS_INDEX) maybeAdd(item);
    for (const item of UPDATES_INDEX) maybeAdd(item);

    const sorted = scored
      .sort((a, b) => b._score - a._score)
      .slice(0, 10)
      .map(({ _score, ...rest }) => rest);

    return sorted;
  }, [debouncedQuery]);

  // إغلاق عند النقر خارجاً
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  return (
    <div ref={wrapperRef} className="relative max-w-3xl md:max-w-3xl lg:max-w-2xl xl:max-w-2xl mx-auto">
      <div className="relative transform transition-transform duration-300 focus-within:scale-[1.005]">
        <div className="absolute inset-y-0 start-4 flex items-center pointer-events-none">
          <Search className="text-slate-400" size={18} />
        </div>
        <input 
          type="text" 
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => { if (query) setIsOpen(true); }}
          placeholder="ابحث عن أي شيء... (إقامة، جواز، ترجمة، طيران...)" 
          className="w-full py-4 md:py-5 ps-11 md:ps-12 pe-6 rounded-2xl text-sm md:text-base shadow-sm focus:outline-none focus:ring-4 focus:ring-accent-500/50 border-0 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-xs md:placeholder:text-sm placeholder:text-slate-400 dark:placeholder:text-slate-400"
        />
        {query && (
            <button onClick={() => { setQuery(''); setIsOpen(false); }} className="absolute inset-y-0 end-4 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">مسح</button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (results.length > 0 || query.length > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-4 z-40 w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden"
          >
            {results.length > 0 ? (
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">نتائج البحث ({results.length})</div>
                {results.map((result) => (
                  <Link 
                    key={result.id} 
                    href={result.url}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0 group"
                  >
                    <div className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 p-2 rounded-lg group-hover:bg-primary-100 group-hover:text-primary-600 transition">
                      <result.icon size={20} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary-700">{result.title}</h4>
                      <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full inline-block mt-1">{result.type}</span>
                    </div>
                    <ArrowLeft size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-primary-500" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 dark:text-slate-300">
                <Search size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                <p>لا توجد نتائج مطابقة لـ &quot;{query}&quot;</p>
                <p className="text-xs text-slate-400 mt-2">جرب كلمات عامة مثل: جواز، إقامة، تأمين</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}