/**
 * Server-side initial ticker data for the homepage.
 *
 * Fetches the rates + active news + admin on/off switch on the SERVER so the
 * NewsTicker renders FULL on the very first paint — no empty dark bar, no
 * client round-trip, no pop-in/flicker. The client component still refreshes
 * these every few minutes for freshness. Bounded by a short timeout so a slow
 * upstream can never block the homepage document (it just falls back to the
 * client fetch for that render — same as before).
 */
import { supabase } from '@/lib/supabaseClient';
import { getRates } from '@/lib/rates';
import { ratesToEntries, newsRowsToEntries, type Entry } from '@/lib/tickerShared';

export interface InitialTicker { entries: Entry[]; hidden: boolean }

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
    return Promise.race([
        p.catch(() => fallback),
        new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
    ]);
}

export async function getInitialTicker(): Promise<InitialTicker> {
    const EMPTY: InitialTicker = { entries: [], hidden: false };

    const work = (async (): Promise<InitialTicker> => {
        // Admin on/off switch — collapse only when explicitly disabled.
        let hidden = false;
        try {
            if (supabase) {
                const { data, error } = await supabase.from('site_settings').select('ticker_enabled').limit(1).maybeSingle();
                if (!error && data && (data as { ticker_enabled?: boolean }).ticker_enabled === false) {
                    return { entries: [], hidden: true };
                }
            }
        } catch { /* default shown */ }

        // Rates (always-present) + active news, in parallel.
        const [ratesRes, newsRes] = await Promise.all([
            getRates().catch(() => null),
            (async () => {
                try {
                    if (!supabase) return null;
                    const { data } = await supabase
                        .from('news_ticker')
                        .select('id, text, link')
                        .eq('is_active', true)
                        .order('priority', { ascending: true });
                    return data as { id: string | number; text: string; link?: string | null }[] | null;
                } catch { return null; }
            })(),
        ]);

        const entries = [
            ...ratesToEntries(ratesRes?.ok ? ratesRes.rates : null),
            ...newsRowsToEntries(newsRes),
        ];
        return { entries, hidden };
    })();

    // 2.5s ceiling — never let the ticker data block the homepage document.
    return withTimeout(work, 2500, EMPTY);
}
