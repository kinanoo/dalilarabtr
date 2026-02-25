'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, ArrowLeft, Search, FileText, Briefcase, Send, MessageCircle, Clock, Link2, Globe } from 'lucide-react';

import { trackWhatsAppClick, trackWhatsAppMessageSent, trackSearch } from '@/lib/analytics';
import type { LucideIcon } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

import { normalizeArabic } from '@/lib/arabicSearch';
import { intelligentTokenize } from '@/lib/intelligentSearch';
import {
  useSearchIndex,
  SearchIndexItem,
  SearchResult,
  getOptimalDebounceTime
} from '@/lib/searchIndex';

import { SITE_CONFIG } from '@/lib/config';

const WHATSAPP_NUMBER = SITE_CONFIG.whatsapp;

// Helper: Check if support is online (9 AM - 6 PM Turkey time)
function isOnlineNow(): boolean {
  const now = new Date();
  const turkeyTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
  const hour = turkeyTime.getHours();
  return hour >= 9 && hour < 18;
}

export default function WhatsAppAssistant() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Search State
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [remoteResults, setRemoteResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const pathname = usePathname();
  const isOnline = isOnlineNow();

  const debounceTime = useMemo(() => getOptimalDebounceTime(), []);

  // Use useSearchIndex hook for combined static and dynamic content
  const { index: searchIndex } = useSearchIndex();

  // Debounce Effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceTime);
    return () => clearTimeout(handler);
  }, [query, debounceTime]);

  const reset = () => {
    setOpen(false);
    setQuery('');
    setResults([]);
  };

  const hasInput = query.trim().length > 0;

  // =====================================================
  // 🔍 البحث الذكي (من GlobalSearch)
  // =====================================================
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

        // 1. Intelligent Query Processing
        const { originalTokens, expandedTokens } = intelligentTokenize(trimmed);
        const searchTokens = originalTokens.length > 0 ? originalTokens : [trimmed];

        // Construct Queries
        // const articleQuery = searchTokens.map(t => `title.ilike.%${t}%,intro.ilike.%${t}%`).join(','); // Removed
        const updateQuery = searchTokens.map(t => `title.ilike.%${t}%,content.ilike.%${t}%`).join(',');
        const questionOrQuery = searchTokens.map(t => `question.ilike.%${t}%`).join(',');
        const nameOrQuery = searchTokens.map(t => `name.ilike.%${t}%`).join(',');
        const professionOrQuery = searchTokens.map(t => `profession.ilike.%${t}%`).join(',');

        // 2. Parallel Search
        const responses = await Promise.allSettled([
          // supabase.from('articles').select('id, title, category, intro').or(articleQuery).limit(10), // Removed
          supabase.from('service_providers').select('id, name, profession').eq('status', 'approved').or(`${nameOrQuery},${professionOrQuery}`).limit(5),
          supabase.from('faqs').select('id, question, answer').or(questionOrQuery).limit(5),
          supabase.from('site_updates').select('id, title, date, content').eq('active', true).or(updateQuery).limit(5),
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

        // Process Results
        // Articles are now handled by local searchIndex (dynamic part)

        if (servicesRes.data) {
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
              haystack: '', // Filled by generic search if needed, but here just placeholder
              _score: stats.score,
              _matchedTokens: stats.matchedTokens
            } as any);
          });
        }

        if (faqsRes.data) {
          faqsRes.data.forEach((f: any) => {
            const stats = calculateRelevance(f.question, searchTokens, expandedTokens);
            newResults.push({
              id: `faq-${f.id}`,
              title: f.question,
              type: 'سؤال وجواب',
              url: `/faq?q=${encodeURIComponent(f.question)}`,
              icon: FileText,
              desc: 'إجابة مباشرة',
              typeKey: 'article',
              haystack: '',
              _score: stats.score,
              _matchedTokens: stats.matchedTokens
            } as any);
          });
        }

        if (updatesRes.data) {
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

        if (sourcesRes.data) {
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
        console.error("Assistant search error:", err);
      } finally {
        setIsSearching(false);
      }
    }

    searchRemote();
  }, [debouncedQuery]);

  // Merge & Sort Local + Remote
  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length === 0) {
      setResults([]);
      return;
    }

    // 1. Local Search
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
        });
      }
    };

    for (const item of searchIndex) {
      maybeAdd(item);
    }

    // 2. Merge
    const allResults = [...remoteResults, ...scored];

    // 3. Sort
    const TYPE_PRIORITY: Record<string, number> = {
      'أداة': 1, 'خدمة دولات': 2, 'مقال': 3, 'استشارة ذكية': 4,
      'سؤال وجواب': 5, 'خدمة': 6, 'مصدر': 7, 'صفحة': 8, 'تحديث': 9
    };

    allResults.sort((a, b) => {
      const scoreDiff = (b._score || 0) - (a._score || 0);
      if (Math.abs(scoreDiff) < 10) {
        const priorityA = TYPE_PRIORITY[a.type] || 99;
        const priorityB = TYPE_PRIORITY[b.type] || 99;
        return priorityA - priorityB;
      }
      return scoreDiff;
    });

    // 4. Adaptive Filtering (Strict Mode)
    // IMPORTANT: This implements the "if words increase and no match remains" logic
    let finalResults = allResults;
    const queryTokensCount = originalTokens.length;
    const maxScore = allResults.length > 0 ? (allResults[0]._score || 0) : 0;

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

    setResults(finalResults.slice(0, 8)); // Limit to 8 compact results for the widget

  }, [debouncedQuery, remoteResults, searchIndex]);

  // =====================================================
  // 📱 إرسال للواتساب
  // =====================================================
  const handleSendWhatsApp = () => {
    if (!query.trim()) return;

    const whatsappMessage = encodeURIComponent(
      `${query}\n\n---\n📱 مرسل من: دليل العرب في تركيا`
    );
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`;

    trackWhatsAppClick('assistant');
    trackWhatsAppMessageSent(query || 'direct_message');

    window.open(whatsappUrl, '_blank');
    reset();
  };

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (wrapperRef.current && !wrapperRef.current.contains(target)) {
        reset();
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="fixed bottom-1 left-4 md:bottom-2 md:left-8 z-[90]">
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="relative flex flex-col items-center justify-center gap-0 bg-emerald-600 hover:bg-emerald-700 text-white font-bold w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all opacity-80 hover:opacity-100 btn-hover-lift animate-fadeIn"
          aria-label="اسأل خبير"
          title="اسأل خبير"
        >
          <span className="absolute -inset-2 rounded-full bg-emerald-400/20 blur-lg animate-ping [animation-duration:3s] pointer-events-none" aria-hidden="true" />
          <MessageCircle size={20} className="mb-0.5" />
          <span className="relative z-10 text-[9px] leading-none text-center px-0.5 hidden">
            اسأل خبير
          </span>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="w-[92vw] max-w-sm rounded-3xl overflow-hidden border-2 border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/95 dark:bg-slate-950 shadow-2xl shadow-emerald-600/10 flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-l from-emerald-700 to-teal-700 text-white border-b border-white/10">
            <div className="flex-1">
              <div className="flex items-center gap-2 font-bold">
                <Search size={18} className="text-white/90" />
                اسأل خبير
              </div>
              {isOnline ? (
                <div className="flex items-center gap-1 text-xs text-emerald-200 mt-1">
                  <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse"></span>
                  الدعم متصل الآن
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-amber-200 mt-1">
                  <Clock size={12} />
                  نرد خلال ساعة (9ص - 6م)
                </div>
              )}
            </div>
            <button onClick={reset} className="p-2 rounded-full hover:bg-white/10 text-white/90" aria-label="إغلاق">
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-3 flex-1 overflow-y-auto">
            <div className="text-[11px] text-emerald-900/80 dark:text-slate-300 mb-2">
              اكتب طلبك وسأقترح روابط من الموقع، أو أرسله للخبراء مباشرة.
            </div>

            <div className="space-y-2">
              <div className="font-bold text-sm text-slate-800 dark:text-slate-100">ما طلبك؟</div>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full min-h-[64px] rounded-xl px-3 py-2 text-sm bg-white/90 dark:bg-slate-900 border border-emerald-200/80 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
                placeholder="اكتب طلبك باختصار..."
                autoFocus
              />

              {hasInput && (
                <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 bg-white/80 dark:bg-slate-950/60 overflow-hidden">
                  <div className="px-3 py-2 bg-emerald-100/80 dark:bg-emerald-950/30 text-[11px] font-bold text-emerald-900 dark:text-emerald-100 border-b border-emerald-200/50 flex justify-between items-center">
                    <span>نتائج من الموقع</span>
                    {isSearching && <span className="text-emerald-500 animate-pulse">جاري البحث...</span>}
                  </div>

                  {results.length > 0 ? (
                    <div className="divide-y divide-emerald-200/60 dark:divide-slate-800">
                      {results.map((r) => (
                        <Link
                          key={r.id}
                          href={r.url}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-emerald-50/60 dark:hover:bg-slate-900 transition group"
                        >
                          <div className="p-2 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition">
                            <r.icon size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-700 transition">{r.title}</div>
                            <div className="text-[10px] text-emerald-900/70 dark:text-slate-400 bg-emerald-100/50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded-full inline-block mt-0.5">{r.type}</div>
                          </div>
                          <ArrowLeft size={14} className="text-emerald-800/40 dark:text-slate-500 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    !isSearching && (
                      <div className="p-4 flex flex-col gap-3">
                        <div className="text-xs text-red-600 dark:text-red-400 font-medium text-center bg-red-50 dark:bg-red-950/20 p-2.5 rounded-lg">
                          ⚠️ لا يوجد شيء مطابق. جرّب كلمات أدق أو أرسل رسالة واتس.
                        </div>
                        <button
                          onClick={handleSendWhatsApp}
                          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-green-600/20 transition-all hover:scale-[1.02] active:scale-95"
                        >
                          <Send size={16} />
                          <span>ارسال عبر واتس للإرسال الى رقمي فورا</span>
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer - Only show generic close/send if we have results. 
               If NO results, the large button is already shown in the block above. 
               But user might still want to force send even if results exist. 
               Let's keep the standard footer clean or just a close button, 
               as the WhatsApp button is contextually appearing.
           */}
          <div className="p-3 bg-white/85 dark:bg-slate-950/80 border-t border-emerald-200/70 dark:border-slate-800 shrink-0 flex gap-2">
            {results.length > 0 && (
              <button
                onClick={handleSendWhatsApp}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 transition-colors flex items-center justify-center gap-2"
              >
                <Send size={14} /> واتساب
              </button>
            )}
            <button
              onClick={reset}
              className={`rounded-xl py-2.5 text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 ${results.length > 0 ? 'w-24' : 'w-full'}`}
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
