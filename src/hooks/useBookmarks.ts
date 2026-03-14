import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'daleel_bookmarks_v1';

export function useBookmarks() {
    const [bookmarks, setBookmarks] = useState<string[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Helper to read safe from storage
    const readFromStorage = () => {
        try {
            if (typeof window === 'undefined') return [];
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    };

    // Initial Load
    useEffect(() => {
        setBookmarks(readFromStorage());
        setIsLoaded(true);
    }, []);

    // Listen for external updates (other tabs or components)
    useEffect(() => {
        const handleStorageChange = (e: Event) => {
            // If custom event, it might not carry data, so we read from storage
            const existing = readFromStorage();

            // Deep compare to avoid redundant updates (which cause loops)
            setBookmarks(prev => {
                if (JSON.stringify(prev) === JSON.stringify(existing)) return prev;
                return existing;
            });
        };

        window.addEventListener('bookmarks-updated', handleStorageChange);
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('bookmarks-updated', handleStorageChange);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const addBookmark = useCallback((id: string) => {
        setBookmarks(prev => {
            if (prev.includes(id)) return prev;
            const next = [...prev, id];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            window.dispatchEvent(new Event('bookmarks-updated'));
            return next;
        });
    }, []);

    const removeBookmark = useCallback((id: string) => {
        setBookmarks(prev => {
            const next = prev.filter(b => b !== id);
            if (next.length === prev.length) return prev;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            window.dispatchEvent(new Event('bookmarks-updated'));
            return next;
        });
    }, []);

    const isBookmarked = useCallback((id: string) => bookmarks.includes(id), [bookmarks]);

    const toggleBookmark = useCallback((id: string) => {
        // We can't rely on 'isBookmarked' here because of closure staleness if not careful,
        // but using functional state update in add/remove is safer.
        // However, we need to return the new state for the UI button.
        // Let's read the current state from the standard 'bookmarks' in this scope, 
        // assuming it's up to date.

        const exists = bookmarks.includes(id);
        if (exists) {
            removeBookmark(id);
            return false;
        } else {
            addBookmark(id);
            return true;
        }
    }, [bookmarks, addBookmark, removeBookmark]);

    return { bookmarks, addBookmark, removeBookmark, isBookmarked, toggleBookmark, isLoaded };
}
