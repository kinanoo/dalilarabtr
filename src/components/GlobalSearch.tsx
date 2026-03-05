/**
 * 🔍 البحث العام الذكي (Intelligent Global Search)
 * ===================================================
 * 
 * بحث ذكي مع فلترة صارمة للنتائج
 * - يفهم المترادفات والسياق
 * - يعرض فقط النتائج المطابقة حقاً
 * 
 * @author Claude AI
 * @lastUpdate 2025-12-28
 */

'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { Search, ArrowLeft, FileText, Briefcase, Link2, Globe } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { normalizeArabic, tokenizeArabicQuery } from '@/lib/arabicSearch';
import { intelligentTokenize } from '@/lib/intelligentSearch';
import { supabase } from '@/lib/supabaseClient';
import {
  getUnifiedSearchIndex,
  getOptimalDebounceTime,
  useSearchIndex, // Import the new hook
  getStaticSearchIndex, // Added
  SearchIndexItem,
  SearchResult
} from '@/lib/searchIndex';

// ...

export default function GlobalSearch({ variant = 'default' }: { variant?: 'default' | 'hero' }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const debounceTime = useMemo(() => getOptimalDebounceTime(), []);

  /* =========================================================
     🧬 DNA TRANSPLANT: LOGIC CLONED FROM WhatsAppAssistant
     ========================================================= */

  // Search State
  const [remoteResults, setRemoteResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Use the SAME hook
  const { index: searchIndex } = useSearchIndex();

  // Debounce effect for query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceTime);

    return () => {
      clearTimeout(handler);
    };
  }, [query, debounceTime]);

  // 1. Remote Search (Supabase) - EXACT COPY from Assistant
  useEffect(() => {
    async function searchRemote() {
      const trimmed = debouncedQuery.trim();
      if (trimmed.length < 2) {
        setRemoteResults([]);
        return;
      }

      setIsSearching(true);
      try {
        if (!supabase) return;

        // Intelligent Tokenize
        const { originalTokens, expandedTokens } = intelligentTokenize(trimmed);
        const searchTokens = originalTokens.length > 0 ? originalTokens : [trimmed];

        // Construct Queries
        const updateQuery = searchTokens.map(t => `title.ilike.%${t}%,content.ilike.%${t}%`).join(',');
        const questionOrQuery = searchTokens.map(t => `question.ilike.%${t}%,answer.ilike.%${t}%`).join(',');
        const nameOrQuery = searchTokens.map(t => `name.ilike.%${t}%`).join(',');
        const professionOrQuery = searchTokens.map(t => `profession.ilike.%${t}%`).join(',');

        // Parallel Search
        const responses = await Promise.allSettled([
          supabase.from('service_providers').select('id, name, profession').eq('status', 'approved').or(`${nameOrQuery},${professionOrQuery}`).limit(5),
          supabase.from('faqs').select('id, question, answer').or(questionOrQuery).limit(5),
          supabase.from('updates').select('id, title, date, content').eq('active', true).or(updateQuery).limit(5),
          supabase.from('official_sources').select('id, name, description, url').or(`${nameOrQuery},description.ilike.%${trimmed}%`).limit(5)
        ]);

        const [servicesRes, faqsRes, updatesRes, sourcesRes] = responses.map(r =>
          r.status === 'fulfilled' ? r.value : { data: [] }
        );

        const newResults: SearchResult[] = [];

        // Helper: Relevance Score
        const calculateRelevance = (text: string, tokens: string[], expanded: string[]) => {
          if (!text) return { score: 0, matchedTokens: 0 };
          const normText = normalizeArabic(text);
          let score = 0;
          let matchedTokens = 0;

          tokens.forEach(token => {
            const t = normalizeArabic(token);
            if (normText.includes(t)) {
              score += 20;
              matchedTokens++;
            }
          });

          expanded.forEach(token => {
            const t = normalizeArabic(token);
            if (normText.includes(t)) {
              score += 5;
            }
          });

          if (matchedTokens === tokens.length && tokens.length > 1) {
            score += 50;
          }

          return { score, matchedTokens };
        };

        // Map Results
        if (servicesRes && servicesRes.data) {
          servicesRes.data.forEach((s: any) => {
            const stats = calculateRelevance(`${s.name} ${s.profession}`, searchTokens, expandedTokens);
            newResults.push({
              id: `srv-${s.id}`,
              title: s.name,
              type: 'خدمة',
              url: `/services/${s.id}`,
              icon: Briefcase,
              desc: s.profession,
              typeKey: 'service',
              haystack: '',
              _score: stats.score,
              _matchedTokens: stats.matchedTokens
            } as any);
          });
        }

        if (faqsRes && faqsRes.data) {
          faqsRes.data.forEach((f: any) => {
            const qStats = calculateRelevance(f.question, searchTokens, expandedTokens);
            const aStats = calculateRelevance(f.answer, searchTokens, expandedTokens);
            const bestScore = Math.max(qStats.score, aStats.score);
            const bestMatched = Math.max(qStats.matchedTokens, aStats.matchedTokens);
            const answerSnippet = f.answer ? f.answer.replace(/<[^>]*>/g, '').slice(0, 80) + (f.answer.length > 80 ? '...' : '') : '';
            newResults.push({
              id: `faq-${f.id}`,
              title: f.question,
              type: 'سؤال وجواب',
              url: `/faq?q=${encodeURIComponent(f.question)}`,
              icon: FileText,
              desc: answerSnippet || 'إجابة مباشرة',
              typeKey: 'article',
              haystack: '',
              _score: bestScore,
              _matchedTokens: bestMatched
            } as any);
          });
        }

        if (updatesRes && updatesRes.data) {
          updatesRes.data.forEach((u: any) => {
            const titleStats = calculateRelevance(u.title, searchTokens, expandedTokens);
            const contentStats = calculateRelevance(u.content, searchTokens, expandedTokens);
            const finalScore = titleStats.score + (contentStats.score * 0.5);
            const finalMatches = Math.max(titleStats.matchedTokens, contentStats.matchedTokens);

            newResults.push({
              id: `upd-${u.id}`,
              title: u.title,
              type: 'تحديث',
              url: `/updates`,
              icon: FileText,
              desc: u.date,
              typeKey: 'article',
              haystack: '',
              _score: finalScore,
              _matchedTokens: finalMatches
            } as any);
          });
        }

        if (sourcesRes && sourcesRes.data) {
          sourcesRes.data.forEach((s: any) => {
            const combinedText = `${s.name} ${s.description || ''}`;
            const stats = calculateRelevance(combinedText, searchTokens, expandedTokens);
            newResults.push({
              id: `src-${s.id}`,
              title: s.name,
              type: 'مصدر',
              url: s.url,
              icon: Link2,
              desc: 'رابط حكومي',
              typeKey: 'service',
              haystack: '',
              _score: stats.score,
              _matchedTokens: stats.matchedTokens
            } as any);
          });
        }

        setRemoteResults(newResults);

      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setIsSearching(false);
      }
    }

    searchRemote();
  }, [debouncedQuery]);

  // 2. Merge & Sort Local + Remote - EXACT COPY
  const results = useMemo(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length === 0) return [];

    const { originalTokens, expandedTokens } = intelligentTokenize(trimmed);
    const needle = normalizeArabic(trimmed);
    const scored: Array<SearchResult & { _score: number }> = [];

    const maybeAdd = (item: SearchIndexItem) => {
      let score = 0;
      // Exact substring
      if (item.haystack.includes(needle)) score += 50;

      // All tokens match
      const allTokensMatch = originalTokens.every(token => {
        const t = normalizeArabic(token);
        return t.length < 2 || item.haystack.includes(t);
      });

      if (allTokensMatch && originalTokens.length > 0) {
        const allTokensInTitle = originalTokens.every(token => {
          const t = normalizeArabic(token);
          return normalizeArabic(item.title).includes(t);
        });
        if (allTokensInTitle) score += 150;
        else score += 40;
      }

      // Partial match
      originalTokens.forEach(token => {
        const tokenNorm = normalizeArabic(token);
        if (tokenNorm.length < 2) return;
        if (item.haystack.includes(tokenNorm)) {
          score += 5;
          if (normalizeArabic(item.title).includes(tokenNorm)) score += 10;
        }
      });

      // Expand
      expandedTokens.forEach(term => {
        const t = normalizeArabic(term);
        if (item.haystack.includes(t)) score += 3;
      });

      if (score > 0) {
        scored.push({
          id: item.id,
          title: item.title,
          type: item.type,
          typeKey: item.typeKey,
          haystack: item.haystack,
          desc: item.desc,
          url: item.url,
          icon: item.icon,
          _score: score,
        } as any);
      }
    };

    // Use searchIndex direct from hook/state
    for (const item of searchIndex) {
      maybeAdd(item);
    }

    // Deduplicate and merge
    const combined = [...remoteResults, ...scored];
    const uniqueMap = new Map<string, SearchResult & { _score: number }>();

    combined.forEach(item => {
      const score = item._score || 0;
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, { ...item, _score: score });
      } else {
        const existing = uniqueMap.get(item.id);
        if (existing && score > existing._score) {
          uniqueMap.set(item.id, { ...item, _score: score });
        }
      }
    });

    const allResults = Array.from(uniqueMap.values());

    // Priority Map (Lower is better)
    const TYPE_PRIORITY: Record<string, number> = {
      'أداة': 1,
      'خدمة دولات': 2,
      'مقال': 3,
      'استشارة ذكية': 4,
      'سؤال وجواب': 5,
      'خدمة': 6,
      'مصدر': 7,
      'صفحة': 8,
      'تحديث': 9
    };

    // 3. Sort Everything by Score (Primary) AND Priority (Secondary)
    allResults.sort((a, b) => {
      const scoreDiff = (b._score || 0) - (a._score || 0);

      // If scores are very close (within 10 points), use priority
      if (Math.abs(scoreDiff) < 10) {
        const priorityA = TYPE_PRIORITY[a.type] || 99;
        const priorityB = TYPE_PRIORITY[b.type] || 99;
        return priorityA - priorityB;
      }

      return scoreDiff;
    });

    // 4. Adaptive Filtering (The "Focus Mode")
    const maxScore = allResults.length > 0 ? (allResults[0]._score || 0) : 0;

    let finalResults = allResults;
    const queryTokensCount = intelligentTokenize(debouncedQuery).originalTokens.length;

    if (queryTokensCount >= 3) {
      const threshold = Math.ceil(queryTokensCount * 0.6);
      finalResults = allResults.filter(r => (r as any)._matchedTokens >= threshold);
    } else if (maxScore >= 100) {
      finalResults = allResults.filter(r => (r._score || 0) >= 40);
    } else if (maxScore >= 50) {
      finalResults = allResults.filter(r => (r._score || 0) >= 15);
    } else {
      finalResults = allResults.filter(r => (r._score || 0) >= 10);
    }

    return finalResults.slice(0, 15);

  }, [debouncedQuery, searchIndex, remoteResults]);



  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isHero = variant === 'hero';
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results.length > 0) {
      router.push(results[0].url);
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className={`relative mx-auto ${isHero ? 'max-w-xl' : 'max-w-3xl md:max-w-3xl lg:max-w-2xl xl:max-w-2xl'}`}>
      <form role="search" onSubmit={handleSubmit} className={`relative transform transition-all duration-300 ${isOpen ? 'scale-100' : 'scale-100'} ${isHero ? 'group' : ''}`}>

        {/* Glow Effect for Hero */}
        {isHero && (
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
        )}

        <div className="absolute inset-y-0 start-4 flex items-center pointer-events-none z-10">
          <Search className={isHero ? "text-slate-400 group-hover:text-emerald-400 transition-colors" : "text-slate-400"} size={isHero ? 22 : 18} />
        </div>

        <input
          type="search"
          aria-label="بحث عام في الموقع"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => { if (query) setIsOpen(true); }}
          placeholder={isHero ? "ماذا تريد أن تعرف اليوم؟ (إقامة، قانون...)" : "ابحث بأي صيغة... (ضيعت كملك، فقدت جواز، بسبور ضاع...)"}
          autoFocus={false}
          className={`
            w-full transition-all outline-none border-0
            ${isHero
              ? 'py-4 ps-12 pe-24 rounded-full bg-slate-900/80 backdrop-blur-2xl text-white placeholder:text-slate-500 text-lg shadow-2xl ring-1 ring-white/10 focus:ring-emerald-500/50 relative z-10'
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
            onClick={() => { setQuery(''); setIsOpen(false); }}
            className="absolute inset-y-0 end-4 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            مسح
          </button>
        )}
      </form>

      <AnimatePresence>
        {isOpen && (results.length > 0 || query.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-4 z-[200] w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden max-h-[60vh] overflow-y-auto"
          >
            {results.length > 0 ? (
              <div className="py-2">
                {isSearching && (
                  <div className="px-4 py-2 text-xs text-center text-emerald-500 animate-pulse">جاري البحث في قاعدة البيانات...</div>
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
                    onClick={() => setIsOpen(false)}
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
                    <ArrowLeft size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 dark:text-slate-300">
                <Search size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                <p className="font-bold mb-2">لا توجد نتائج مطابقة لـ &quot;{query}&quot;</p>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  💡 <strong>نصيحة:</strong> جرب كلمات أساسية:<br />
                  إقامة، جواز، كملك، تأمين، ترجمة
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
