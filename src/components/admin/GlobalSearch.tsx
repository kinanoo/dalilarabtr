'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, FileText, Briefcase, MessageSquare, AlertTriangle, ChevronRight, X, BrainCircuit, MapPin, ShieldAlert, Star, HelpCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// Simple Debounce hook implementation locally
function useDebounceValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

// --- Extracted Components to prevent re-render focus loss ---

interface SearchInputProps {
    query: string;
    setQuery: (q: string) => void;
    setIsResultsOpen: (isOpen: boolean) => void;
    loading: boolean;
    isModal?: boolean;
    inputRef?: React.RefObject<HTMLInputElement>;
    onClose?: () => void; // specific for modal close button
}

const SearchInput = ({ query, setQuery, setIsResultsOpen, loading, isModal = false, inputRef, onClose }: SearchInputProps) => (
    <div className={`relative group ${isModal ? 'w-full' : ''}`}>
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
        </div>
        <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value) setIsResultsOpen(true);
            }}
            onFocus={() => { if (query) setIsResultsOpen(true); }}
            autoFocus={isModal}
            placeholder="ابحث شامل (مقالات، خدمات، أكواد، مناطق، ذكاء اصطناعي...)"
            className={`w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl py-4 pr-12 pl-4 text-lg font-bold shadow-sm focus:outline-none focus:border-emerald-500 focus:shadow-emerald-500/20 transition-all text-slate-800 dark:text-white placeholder:text-slate-400 ${isModal ? 'bg-slate-100 dark:bg-slate-950 border-0 shadow-none' : ''}`}
        />
        {query && (
            <button
                onClick={() => { setQuery(''); setIsResultsOpen(false); inputRef?.current?.focus(); }}
                className="absolute inset-y-0 left-3 text-slate-400 hover:text-slate-600"
            >
                <X size={16} />
            </button>
        )}
    </div>
);

interface ResultsListProps {
    results: any;
    loading: boolean;
    query: string;
    mode: 'inline' | 'modal';
    onClose: () => void;
    recentSearches?: string[];
    onSelectRecent?: (term: string) => void;
    onRemoveRecent?: (term: string) => void;
}

const ResultsList = ({ results, loading, query, mode, onClose, recentSearches = [], onSelectRecent, onRemoveRecent }: ResultsListProps) => {
    const hasResults = Object.values(results).some((arr: any) => arr.length > 0);

    const renderSection = (title: string, items: any[], icon: any, renderItem: (item: any) => React.ReactNode) => {
        if (!items || items.length === 0) return null;
        return (
            <div className="p-2 border-t border-slate-100 dark:border-slate-800 first:border-0">
                <div className="text-xs font-bold text-slate-400 px-3 py-2 uppercase tracking-wider flex items-center gap-2">
                    {icon} {title}
                </div>
                {items.map((item, idx) => (
                    <div key={item.id || item.code || idx} onClick={onClose}>
                        {renderItem(item)}
                    </div>
                ))}
            </div>
        );
    };

    // Show recent searches when input is focused but empty
    if (!query && recentSearches.length > 0) {
        return (
            <div className={`w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-top-2 ${mode === 'inline' ? 'absolute top-full mt-2' : 'mt-4 relative shadow-none border-0 bg-transparent dark:bg-transparent'}`}>
                <div className="p-2">
                    <div className="text-xs font-bold text-slate-400 px-3 py-2 uppercase tracking-wider">عمليات البحث الأخيرة</div>
                    {recentSearches.map((term, idx) => (
                        <div key={idx} className="flex items-center group/recent">
                            <button
                                onClick={() => onSelectRecent?.(term)}
                                className="flex-1 flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-right"
                            >
                                <Search size={14} className="text-slate-400 shrink-0" />
                                <span className="text-slate-700 dark:text-slate-300 font-bold text-sm">{term}</span>
                            </button>
                            <button
                                onClick={() => onRemoveRecent?.(term)}
                                className="p-2 text-slate-300 hover:text-red-400 opacity-0 group-hover/recent:opacity-100 transition-all ml-1 rounded-lg"
                                title="حذف من السجل"
                            >
                                <X size={13} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={`w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[70vh] overflow-y-auto animate-in fade-in slide-in-from-top-2 ${mode === 'inline' ? 'absolute top-full mt-2' : 'mt-4 relative shadow-none border-0 bg-transparent dark:bg-transparent'}`}>
            {!loading && !hasResults && query && (
                <div className="p-8 text-center text-slate-500">
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>لا توجد نتائج شاملة لـ "{query}"</p>
                </div>
            )}

            {renderSection('المقالات', results.articles, <FileText size={14} />, (item) => (
                <Link href={`/admin/articles/${item.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><FileText size={18} /></div>
                    <div className="flex-1">
                        <div className="font-bold text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">{item.title}</div>
                        <div className="text-xs text-slate-500">{item.category}</div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                </Link>
            ))}

            {renderSection('الخدمات', results.services, <Briefcase size={14} />, (item) => (
                <Link href={`/admin/services`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Briefcase size={18} /></div>
                    <div className="flex-1">
                        <div className="font-bold text-slate-800 dark:text-white group-hover:text-emerald-600 transition-colors">{item.name}</div>
                        <div className="text-xs text-slate-500">{item.profession}</div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                </Link>
            ))}

            {renderSection('السيناريوهات (AI)', results.scenarios, <BrainCircuit size={14} />, (item) => (
                <Link href={`/admin/scenarios/${item.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                    <div className="p-2 bg-violet-100 text-violet-600 rounded-lg"><BrainCircuit size={18} /></div>
                    <div className="flex-1">
                        <div className="font-bold text-slate-800 dark:text-white group-hover:text-violet-600 transition-colors">{item.title}</div>
                        <div className="text-xs text-slate-500 line-clamp-1">{item.description}</div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                </Link>
            ))}

            {renderSection('المناطق المحظورة', results.zones, <MapPin size={14} />, (item) => (
                <Link href={`/admin/zones/${item.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                    <div className="p-2 bg-red-100 text-red-600 rounded-lg"><MapPin size={18} /></div>
                    <div className="flex-1">
                        <div className="font-bold text-slate-800 dark:text-white group-hover:text-red-600 transition-colors">{item.neighborhood}</div>
                        <div className="text-xs text-slate-500">{item.district} - {item.city}</div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                </Link>
            ))}

            {renderSection('أكواد أمنية', results.codes, <ShieldAlert size={14} />, (item) => (
                <Link href={`/admin/codes/${item.code || item.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><ShieldAlert size={18} /></div>
                    <div className="flex-1">
                        <div className="font-bold text-slate-800 dark:text-white group-hover:text-amber-600 transition-colors font-mono">{item.code}</div>
                        <div className="text-xs text-slate-500 line-clamp-1">{item.title}</div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                </Link>
            ))}

            {renderSection('التعليقات', results.comments, <MessageSquare size={14} />, (item) => (
                <Link href={`/admin/community`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><MessageSquare size={18} /></div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-800 dark:text-white truncate">{item.content}</div>
                        <div className="text-xs text-slate-500">بواسطة: {item.author_name}</div>
                    </div>
                </Link>
            ))}

            {renderSection('الأسئلة الشائعة', results.faqs, <HelpCircle size={14} />, (item) => (
                <Link href={`/admin/faqs/${item.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                    <div className="p-2 bg-sky-100 text-sky-600 rounded-lg"><HelpCircle size={18} /></div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-800 dark:text-white truncate">{item.question}</div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                </Link>
            ))}

            {renderSection('تقييمات الخدمات', results.reviews, <Star size={14} />, (item) => (
                <Link href={`/admin/reviews`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><Star size={18} /></div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-800 dark:text-white truncate">{item.comment}</div>
                        <div className="text-xs text-slate-500">{item.client_name}</div>
                    </div>
                </Link>
            ))}
        </div>
    );
};

// --- Main Component ---

const RECENT_SEARCHES_KEY = 'admin_recent_searches';
const MAX_RECENT = 8;

function loadRecentSearches(): string[] {
    try { return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]'); } catch { return []; }
}

function saveRecentSearch(term: string) {
    try {
        const existing = loadRecentSearches().filter(s => s !== term);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify([term, ...existing].slice(0, MAX_RECENT)));
    } catch {}
}

function removeRecentSearch(term: string) {
    try {
        const existing = loadRecentSearches().filter(s => s !== term);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(existing));
    } catch {}
}

export function GlobalSearch({ mode = 'inline' }: { mode?: 'inline' | 'modal' }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any>({
        articles: [], services: [], comments: [], feedback: [], scenarios: [], zones: [], codes: [], faqs: [], reviews: []
    });
    const [loading, setLoading] = useState(false);
    const [isResultsOpen, setIsResultsOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    const debouncedQuery = useDebounceValue(query, 500);
    const containerRef = useRef<HTMLDivElement>(null);
    const modalInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!debouncedQuery.trim()) {
            setResults({ articles: [], services: [], comments: [], feedback: [], scenarios: [], zones: [], codes: [], faqs: [], reviews: [] });
            return;
        }
        performSearch();
    }, [debouncedQuery]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsResultsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus input and load recents when modal opens
    useEffect(() => {
        if (isModalOpen) {
            setRecentSearches(loadRecentSearches());
            setTimeout(() => { modalInputRef.current?.focus(); }, 100);
        }
    }, [isModalOpen]);

    const performSearch = async () => {
        if (!supabase) return;
        setLoading(true);
        setIsResultsOpen(true);

        // Safety timeout — ensure loading spinner never gets stuck
        const safetyTimeout = setTimeout(() => setLoading(false), 6000);

        const term = `%${debouncedQuery}%`;

        // Helper for robust searching
        const searchTable = async (table: string, select: string, searchCol: string, extraFilter?: (q: any) => any) => {
            if (!supabase) return [];
            try {
                let q = supabase.from(table).select(select);
                if (searchCol.includes(',')) {
                    const conditions = searchCol.split(',').map(c => `${c}.ilike.${term}`).join(',');
                    q = q.or(conditions);
                } else {
                    q = q.ilike(searchCol, term);
                }
                if (extraFilter) q = extraFilter(q);

                const { data, error } = await q.limit(4);
                if (error) return [];
                return data || [];
            } catch (e) {
                return [];
            }
        };

        const [articles, services, comments, feedback, scenarios, zones, codes, faqs, reviews] = await Promise.all([
            searchTable('articles', 'id, title, category', 'title'),
            searchTable('service_providers', 'id, name, profession', 'name'),
            searchTable('comments', 'id, content, author_name', 'content'),
            searchTable('content_votes', 'id, feedback, reason', 'feedback,reason', (q) => q.eq('vote_type', 'down')),
            searchTable('consultant_scenarios', 'id, title, description', 'title,description'),
            searchTable('zones', 'id, neighborhood, district, city', 'neighborhood,district,city'),
            searchTable('security_codes', 'code, title, description', 'title,description,code'),
            searchTable('faqs', 'id, question', 'question,answer'),
            searchTable('service_reviews', 'id, client_name, comment', 'comment,client_name')
        ]);

        setResults({
            articles, services, comments, feedback,
            scenarios: scenarios,
            zones: zones,
            codes: codes,
            faqs, reviews
        });

        // Save to recent searches if there were results
        const hasAny = [articles, services, comments, feedback, scenarios, zones, codes, faqs, reviews].some(arr => arr.length > 0);
        if (hasAny && debouncedQuery.trim().length >= 2) {
            saveRecentSearch(debouncedQuery.trim());
            setRecentSearches(loadRecentSearches());
        }

        clearTimeout(safetyTimeout);
        setLoading(false);
    };

    if (mode === 'modal') {
        return (
            <>
                {/* Trigger Button */}
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-500 transition-colors"
                >
                    <Search size={20} />
                </button>

                {/* Modal Overlay */}
                <AnimatePresence>
                    {isModalOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 z-[250] bg-white dark:bg-slate-950 p-4 flex flex-col"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <SearchInput
                                    query={query}
                                    setQuery={setQuery}
                                    setIsResultsOpen={setIsResultsOpen}
                                    loading={loading}
                                    isModal={true}
                                    inputRef={modalInputRef}
                                />
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-3 bg-red-50 text-red-500 rounded-xl font-bold whitespace-nowrap"
                                >
                                    إلغاء
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {(query || Object.values(results).some((arr: any) => arr.length > 0) || recentSearches.length > 0) && (
                                    <div className="pb-20">
                                        <ResultsList
                                            results={results}
                                            loading={loading}
                                            query={query}
                                            mode="modal"
                                            onClose={() => { setIsResultsOpen(false); setIsModalOpen(false); }}
                                            recentSearches={recentSearches}
                                            onSelectRecent={(term) => { setQuery(term); setIsResultsOpen(true); }}
                                            onRemoveRecent={(term) => { removeRecentSearch(term); setRecentSearches(loadRecentSearches()); }}
                                        />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </>
        );
    }

    return (
        <div className="relative w-full max-w-4xl mx-auto z-50" ref={containerRef}>
            <SearchInput
                query={query}
                setQuery={setQuery}
                setIsResultsOpen={(open) => { setIsResultsOpen(open); if (open) setRecentSearches(loadRecentSearches()); }}
                loading={loading}
            />

            {/* Results Dropdown — also shows recents on focus */}
            {isResultsOpen && (query.length > 0 || recentSearches.length > 0) && (
                <div className="absolute top-full mt-2 w-full z-[60]">
                    <ResultsList
                        results={results}
                        loading={loading}
                        query={query}
                        mode="inline"
                        onClose={() => setIsResultsOpen(false)}
                        recentSearches={recentSearches}
                        onSelectRecent={(term) => { setQuery(term); setIsResultsOpen(true); }}
                        onRemoveRecent={(term) => { removeRecentSearch(term); setRecentSearches(loadRecentSearches()); }}
                    />
                </div>
            )}
        </div>
    );
}
