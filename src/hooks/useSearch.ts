import { useState, useEffect, useCallback } from 'react';
import logger from '@/lib/logger';

interface SearchResult {
    id: string;
    title: string;
    description?: string;
    category?: string;
    url: string;
}

export function useSearch(data: SearchResult[], debounceMs: number = 300) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);

    // Load search history from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('searchHistory');
        if (stored) {
            try {
                setSearchHistory(JSON.parse(stored));
            } catch (e) {
                logger.error('Failed to parse search history', e);
            }
        }
    }, []);

    // Perform search with debounce
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const timer = setTimeout(() => {
            const searchQuery = query.toLowerCase();
            const filtered = data.filter((item) =>
                item.title.toLowerCase().includes(searchQuery) ||
                item.description?.toLowerCase().includes(searchQuery) ||
                item.category?.toLowerCase().includes(searchQuery)
            );
            setResults(filtered);
            setIsSearching(false);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [query, data, debounceMs]);

    // Add to search history
    const addToHistory = useCallback((searchQuery: string) => {
        if (!searchQuery.trim()) return;

        setSearchHistory((prev) => {
            const newHistory = [searchQuery, ...prev.filter((q) => q !== searchQuery)].slice(0, 5);
            localStorage.setItem('searchHistory', JSON.stringify(newHistory));
            return newHistory;
        });
    }, []);

    // Clear search history
    const clearHistory = useCallback(() => {
        setSearchHistory([]);
        localStorage.removeItem('searchHistory');
    }, []);

    return {
        query,
        setQuery,
        results,
        isSearching,
        searchHistory,
        addToHistory,
        clearHistory,
    };
}
