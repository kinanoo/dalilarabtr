import useSWR from 'swr';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/logger';

/**
 * Universal Resource Hook
 * 
 * @param key Unique cache key (e.g. 'articles', 'services')
 * @param tableName Supabase table name to fetch from
 * @param staticData Initial/Fallback static data
 * @param merger Function to merge static and remote data
 * @returns { data, loading, error, mutate }
 */
export function useResource<T extends { id: string; active?: boolean }>(
    key: string,
    tableName: string | null,
    staticData: T[],
    merger: (staticItems: T[], remoteItems: T[]) => T[],
    // Optional raw remote rows fetched on the server (SSR). When provided, SWR
    // hydrates with these so the merged list is present in the first HTML —
    // crawlers/no-JS see real content instead of an empty shell.
    fallbackData?: any[]
) {
    const fetcher = async () => {
        if (!tableName || !supabase) return [];

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .abortSignal(controller.signal);

            clearTimeout(timeout);
            if (error) throw error;
            return data as T[];
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') {
                logger.warn(`Timeout fetching ${tableName} (10s)`);
            } else {
                logger.error(`Error fetching ${tableName}:`, err);
            }
            return []; // Return empty on error to fallback to static
        }
    };

    // When the server already delivered fresh (ISR) rows in the first HTML,
    // do NOT make every visitor's browser re-download the whole table. This
    // is the main Supabase-egress saver: an SSR page then costs ZERO client
    // DB bandwidth. mutate() still fetches on demand (e.g. after an action),
    // and pages WITHOUT server data (admin, client-only) keep revalidating
    // normally. Freshness for public content comes from the page's own
    // `revalidate` (ISR) window on the server, not per-visitor refetches.
    const hasServerData = Array.isArray(fallbackData);
    const { data: remoteData, error, isLoading, mutate } = useSWR(tableName ? key : null, fetcher, {
        revalidateOnFocus: false, // Don't revalidate on window focus to save requests
        revalidateOnReconnect: false,
        dedupingInterval: 60000, // Cache for 1 minute
        ...(hasServerData
            ? { fallbackData: fallbackData as T[], revalidateOnMount: false, revalidateIfStale: false }
            : {}),
    });

    // Merge Logic
    // If remoteData is undefined (loading), we can show static (optimistic) or wait
    // Strategy: Always show static + whatever we have from remote
    const combinedData = merger(staticData, remoteData || []);

    return {
        data: combinedData,
        loading: isLoading && !remoteData, // Only true loading if we have NO data yet
        error,
        mutate
    };
}

/**
 * Standard Merger Strategy
 * Prioritizes Remote data. If an item exists in both (by ID), Remote wins.
 * Items only in Static are kept (fallback).
 * Items only in Remote are added.
 */
export function standardMerger<T extends { id: string }>(
    statics: T[],
    remotes: T[]
): T[] {
    if (!remotes || remotes.length === 0) return statics;

    const remoteMap = new Map(remotes.map(r => [r.id, r]));
    const merged: T[] = [...remotes];

    statics.forEach(s => {
        if (!remoteMap.has(s.id)) {
            merged.push(s);
        }
    });

    return merged;
}
