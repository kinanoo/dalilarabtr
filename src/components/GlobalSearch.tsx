/**
 * 🔍 البحث العام المُحسّن (Optimized Global Search)
 * ==================================================
 * 
 * التحسينات المُطبقة:
 * 1. استخدام الفهرس الموحد بدلاً من بناء فهرس جديد
 * 2. Debounce ذكي يتكيف مع قوة الجهاز
 * 3. تحسين أداء البحث على الأجهزة الضعيفة
 * 
 * @author Claude AI
 * @lastUpdate 2025-12-20
 */

'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { Search, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { minTokenMatches, normalizeArabic, scoreMatch, tokenizeArabicQuery } from '@/lib/arabicSearch';
import { 
  getUnifiedSearchIndex, 
  getOptimalDebounceTime,
  type SearchIndexItem,
  type SearchResult 
} from '@/lib/searchIndex';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  // ⚡ الحصول على وقت الـ Debounce المناسب للجهاز
  const debounceTime = useMemo(() => getOptimalDebounceTime(), []);

  // ⚡ الحصول على الفهرس الموحد (يُبنى مرة واحدة فقط)
  const searchIndex = useMemo(() => getUnifiedSearchIndex(), []);

  // ⏱️ Debounce ذكي
  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedQuery(query), debounceTime);
    return () => window.clearTimeout(handle);
  }, [query, debounceTime]);

  // 🔍 البحث في الفهرس
  const results = useMemo((): SearchResult[] => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length === 0) return [];

    const tokens = tokenizeArabicQuery(trimmed);
    const needle = normalizeArabic(trimmed);
    const minMatched = minTokenMatches(tokens);

    const scored: Array<SearchResult & { _score: number }> = [];

    const maybeAdd = (item: SearchIndexItem) => {
      // إذا لم يكن هناك tokens، نبحث بالعبارة الكاملة
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

    // البحث في الفهرس الموحد
    for (const item of searchIndex) {
      maybeAdd(item);
    }

    // ترتيب النتائج وإرجاع أفضل 10
    const sorted = scored
      .sort((a, b) => b._score - a._score)
      .slice(0, 10)
      .map(({ _score, ...rest }) => rest);

    return sorted;
  }, [debouncedQuery, searchIndex]);

  // إغلاق عند النقر خارجاً
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          className="w-full py-4 md:py-5 ps-11 md:ps-12 pe-16 rounded-2xl text-sm md:text-base shadow-sm focus:outline-none focus:ring-4 focus:ring-accent-500/50 border-0 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-xs md:placeholder:text-sm placeholder:text-slate-400 dark:placeholder:text-slate-400"
        />
        {query && (
          <button 
            onClick={() => { setQuery(''); setIsOpen(false); }} 
            className="absolute inset-y-0 end-4 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            مسح
          </button>
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
                <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                  نتائج البحث ({results.length})
                </div>
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
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary-700 truncate">
                        {result.title}
                      </h4>
                      <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full inline-block mt-1">
                        {result.type}
                      </span>
                    </div>
                    <ArrowLeft size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-primary-500 flex-shrink-0" />
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
