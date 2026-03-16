/**
 * 🔍 Global Search Logic Hook
 * ============================
 * Extracted from GlobalSearch.tsx for better maintainability.
 * Handles: debounce, local index search, remote Supabase search, merge & sort.
 */

import { useMemo, useState, useEffect, useCallback } from 'react';
import { FileText, Briefcase, Link2, ShieldAlert } from 'lucide-react';
import { normalizeArabic } from '@/lib/arabicSearch';
import { intelligentTokenize } from '@/lib/intelligentSearch';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/logger';
import {
  getOptimalDebounceTime,
  useSearchIndex,
  SearchIndexItem,
  SearchResult,
} from '@/lib/searchIndex';

const RECENT_SEARCHES_KEY = 'dalil_recent_searches';
const MAX_RECENT = 5;

export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveRecentSearch(term: string) {
  if (typeof window === 'undefined' || !term.trim()) return;
  const recent = getRecentSearches().filter((s) => s !== term.trim());
  recent.unshift(term.trim());
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

export const POPULAR_SEARCHES = [
  'تجديد الإقامة',
  'الكملك',
  'المناطق المحظورة',
  'إذن العمل',
  'الأكواد الأمنية',
  'الإقامة السياحية',
  'الجنسية التركية',
  'التأمين الصحي',
];

/** Priority map for result type ordering (lower = better) */
const TYPE_PRIORITY: Record<string, number> = {
  'أداة': 1,
  'خدمة دولات': 2,
  'مقال': 3,
  'استشارة ذكية': 4,
  'سؤال وجواب': 5,
  'خدمة': 6,
  'مصدر': 7,
  'صفحة': 8,
  'تحديث': 9,
};

/** Relevance scorer for remote results */
function calculateRelevance(
  text: string,
  tokens: string[],
  expanded: string[]
): { score: number; matchedTokens: number } {
  if (!text) return { score: 0, matchedTokens: 0 };
  const normText = normalizeArabic(text);
  let score = 0;
  let matchedTokens = 0;

  tokens.forEach((token) => {
    const t = normalizeArabic(token);
    if (normText.includes(t)) {
      score += 20;
      matchedTokens++;
    }
  });

  expanded.forEach((token) => {
    const t = normalizeArabic(token);
    if (normText.includes(t)) {
      score += 5;
    }
  });

  if (matchedTokens === tokens.length && tokens.length > 1) {
    score += 50;
  }

  return { score, matchedTokens };
}

export function useGlobalSearch() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [remoteResults, setRemoteResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const debounceTime = useMemo(() => getOptimalDebounceTime(), []);
  const { index: searchIndex } = useSearchIndex();

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Autocomplete suggestions from index titles
  const suggestions = useMemo(() => {
    const trimmed = query.trim();
    if (trimmed.length < 1) return [];
    const needle = normalizeArabic(trimmed);
    if (needle.length < 1) return [];

    const matches: { title: string; url: string }[] = [];
    const seen = new Set<string>();

    for (const item of searchIndex) {
      const normTitle = normalizeArabic(item.title);
      if (normTitle.includes(needle) && !seen.has(item.title)) {
        seen.add(item.title);
        matches.push({ title: item.title, url: item.url });
        if (matches.length >= 6) break;
      }
    }
    return matches;
  }, [query, searchIndex]);

  // Debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      if (query.trim().length >= 2) {
        setIsOpen(true);
        setShowSuggestions(false);
      }
    }, debounceTime);
    return () => clearTimeout(handler);
  }, [query, debounceTime]);

  // Remote search (Supabase)
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

        const { originalTokens, expandedTokens } = intelligentTokenize(trimmed);
        const searchTokens = originalTokens.length > 0 ? originalTokens : [trimmed];

        const updateQuery = searchTokens.map((t) => `title.ilike.%${t}%,content.ilike.%${t}%`).join(',');
        const questionOrQuery = searchTokens.map((t) => `question.ilike.%${t}%,answer.ilike.%${t}%`).join(',');
        const nameOrQuery = searchTokens.map((t) => `name.ilike.%${t}%`).join(',');
        const professionOrQuery = searchTokens.map((t) => `profession.ilike.%${t}%`).join(',');

        const numbers = trimmed.match(/\d+/g);
        const codeOrParts: string[] = [];
        if (numbers) numbers.forEach((n) => codeOrParts.push(`code.ilike.%${n}%`));
        searchTokens.forEach((t) => {
          codeOrParts.push(`title.ilike.%${t}%`);
          codeOrParts.push(`description.ilike.%${t}%`);
        });
        const codeOrQuery = codeOrParts.join(',');

        const responses = await Promise.allSettled([
          supabase.from('service_providers').select('id, name, profession').eq('status', 'approved').or(`${nameOrQuery},${professionOrQuery}`).limit(5),
          supabase.from('faqs').select('id, question, answer').or(questionOrQuery).limit(5),
          supabase.from('updates').select('id, title, date, content').eq('active', true).or(updateQuery).limit(5),
          supabase.from('official_sources').select('id, name, description, url').or(`${nameOrQuery},description.ilike.%${trimmed}%`).limit(5),
          supabase.from('security_codes').select('code, title, description').or(codeOrQuery).limit(5),
        ]);

        const [servicesRes, faqsRes, updatesRes, sourcesRes, codesRes] = responses.map((r) =>
          r.status === 'fulfilled' ? r.value : { data: [] }
        );

        const newResults: SearchResult[] = [];

        if (servicesRes?.data) {
          servicesRes.data.forEach((s: any) => {
            const stats = calculateRelevance(`${s.name} ${s.profession}`, searchTokens, expandedTokens);
            newResults.push({ id: `srv-${s.id}`, title: s.name, type: 'خدمة', url: `/services/${s.id}`, icon: Briefcase, desc: s.profession, typeKey: 'service', haystack: '', _score: stats.score, _matchedTokens: stats.matchedTokens } as any);
          });
        }

        if (faqsRes?.data) {
          faqsRes.data.forEach((f: any) => {
            const qStats = calculateRelevance(f.question, searchTokens, expandedTokens);
            const aStats = calculateRelevance(f.answer, searchTokens, expandedTokens);
            const answerSnippet = f.answer ? f.answer.replace(/<[^>]*>/g, '').slice(0, 80) + (f.answer.length > 80 ? '...' : '') : '';
            newResults.push({ id: `faq-${f.id}`, title: f.question, type: 'سؤال وجواب', url: `/faq?q=${encodeURIComponent(f.question)}`, icon: FileText, desc: answerSnippet || 'إجابة مباشرة', typeKey: 'article', haystack: '', _score: Math.max(qStats.score, aStats.score), _matchedTokens: Math.max(qStats.matchedTokens, aStats.matchedTokens) } as any);
          });
        }

        if (updatesRes?.data) {
          updatesRes.data.forEach((u: any) => {
            const titleStats = calculateRelevance(u.title, searchTokens, expandedTokens);
            const contentStats = calculateRelevance(u.content, searchTokens, expandedTokens);
            newResults.push({ id: `upd-${u.id}`, title: u.title, type: 'تحديث', url: `/updates/${u.id}`, icon: FileText, desc: u.date, typeKey: 'article', haystack: '', _score: titleStats.score + contentStats.score * 0.5, _matchedTokens: Math.max(titleStats.matchedTokens, contentStats.matchedTokens) } as any);
          });
        }

        if (sourcesRes?.data) {
          sourcesRes.data.forEach((s: any) => {
            const stats = calculateRelevance(`${s.name} ${s.description || ''}`, searchTokens, expandedTokens);
            newResults.push({ id: `src-${s.id}`, title: s.name, type: 'مصدر', url: s.url, icon: Link2, desc: 'رابط حكومي', typeKey: 'service', haystack: '', _score: stats.score, _matchedTokens: stats.matchedTokens } as any);
          });
        }

        if (codesRes?.data) {
          codesRes.data.forEach((c: any) => {
            const stats = calculateRelevance(`${c.code} ${c.title} ${c.description || ''}`, searchTokens, expandedTokens);
            const numberBoost = numbers ? 30 : 0;
            newResults.push({ id: `code-${c.code}`, title: `كود ${c.code}: ${c.title}`, type: 'كود أمني', url: `/codes/${c.code}`, icon: ShieldAlert, desc: c.description?.substring(0, 80) || 'شرح الكود الأمني', typeKey: 'tool', haystack: '', _score: stats.score + numberBoost, _matchedTokens: stats.matchedTokens } as any);
          });
        }

        setRemoteResults(newResults);
      } catch (err) {
        logger.error('Global search error:', err);
      } finally {
        setIsSearching(false);
      }
    }

    searchRemote();
  }, [debouncedQuery]);

  // Merge & Sort local + remote
  const results = useMemo(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length === 0) return [];

    const { originalTokens, expandedTokens } = intelligentTokenize(trimmed);
    const needle = normalizeArabic(trimmed);
    const scored: Array<SearchResult & { _score: number }> = [];

    const maybeAdd = (item: SearchIndexItem) => {
      let score = 0;
      let matchedTokens = 0;
      const titleNorm = normalizeArabic(item.title);

      if (item.haystack.includes(needle)) score += 50;

      originalTokens.forEach((token) => {
        const tokenNorm = normalizeArabic(token);
        if (tokenNorm.length < 2) return;
        if (item.haystack.includes(tokenNorm) || titleNorm.includes(tokenNorm)) matchedTokens++;
      });

      if (matchedTokens < originalTokens.length) {
        const unmatchedOriginal = originalTokens.filter((token) => {
          const t = normalizeArabic(token);
          return t.length >= 2 && !item.haystack.includes(t) && !titleNorm.includes(t);
        });
        for (const token of unmatchedOriginal) {
          const hasSynonymMatch = expandedTokens.some((exp) => {
            if (exp === token) return false;
            const expNorm = normalizeArabic(exp);
            return expNorm.length >= 2 && (item.haystack.includes(expNorm) || titleNorm.includes(expNorm));
          });
          if (hasSynonymMatch) matchedTokens++;
        }
      }

      if (matchedTokens === originalTokens.length && originalTokens.length > 0) {
        const allTokensInTitle = originalTokens.every((token) => {
          const t = normalizeArabic(token);
          return t.length < 2 || titleNorm.includes(t);
        });
        score += allTokensInTitle ? 150 : 40;
      }

      originalTokens.forEach((token) => {
        const tokenNorm = normalizeArabic(token);
        if (tokenNorm.length < 2) return;
        if (item.haystack.includes(tokenNorm)) {
          score += 5;
          if (titleNorm.includes(tokenNorm)) score += 10;
        }
      });

      expandedTokens.forEach((term) => {
        const t = normalizeArabic(term);
        if (item.haystack.includes(t)) score += 3;
      });

      if (score > 0 || matchedTokens > 0) {
        scored.push({
          id: item.id,
          title: item.title,
          type: item.type,
          typeKey: item.typeKey,
          haystack: item.haystack,
          desc: item.desc,
          url: item.url,
          icon: item.icon,
          _score: Math.max(score, matchedTokens * 8),
          _matchedTokens: matchedTokens,
        } as any);
      }
    };

    for (const item of searchIndex) {
      maybeAdd(item);
    }

    // Deduplicate and merge
    const combined = [...remoteResults, ...scored];
    const uniqueMap = new Map<string, SearchResult & { _score: number }>();

    combined.forEach((item) => {
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

    allResults.sort((a, b) => {
      const scoreDiff = (b._score || 0) - (a._score || 0);
      if (Math.abs(scoreDiff) < 10) {
        const priorityA = TYPE_PRIORITY[a.type] || 99;
        const priorityB = TYPE_PRIORITY[b.type] || 99;
        return priorityA - priorityB;
      }
      return scoreDiff;
    });

    // Adaptive filtering
    const maxScore = allResults.length > 0 ? allResults[0]._score || 0 : 0;
    let finalResults = allResults;
    const queryTokensCount = intelligentTokenize(debouncedQuery).originalTokens.length;

    if (queryTokensCount >= 3) {
      const threshold = Math.max(1, Math.ceil(queryTokensCount * 0.35));
      finalResults = allResults.filter((r) => (r._matchedTokens ?? 0) >= threshold || (r._score ?? 0) >= 40);
    } else if (maxScore >= 100) {
      finalResults = allResults.filter((r) => (r._score || 0) >= 40);
    } else if (maxScore >= 50) {
      finalResults = allResults.filter((r) => (r._score || 0) >= 15);
    } else {
      finalResults = allResults.filter((r) => (r._score || 0) >= 10);
    }

    return finalResults.slice(0, 15);
  }, [debouncedQuery, searchIndex, remoteResults]);

  const refreshRecent = useCallback(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  return {
    query,
    setQuery,
    debouncedQuery,
    isOpen,
    setIsOpen,
    showSuggestions,
    setShowSuggestions,
    recentSearches,
    suggestions,
    results,
    isSearching,
    refreshRecent,
  };
}
