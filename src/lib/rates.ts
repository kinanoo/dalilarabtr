/**
 * Live TRY exchange rates — shared server-side fetcher.
 *
 * Extracted from app/api/rates/route.ts so BOTH the public /api/rates endpoint
 * (client refresh) AND the homepage server render (initial ticker content) can
 * compute rates from one place. Keyless, edge-cached via `next.revalidate`, and
 * resilient: each source is isolated so one failure falls through to the next.
 */

const REVALIDATE = 600; // 10 min — Next dedupes/caches these external fetches
const UA = 'Mozilla/5.0 (compatible; dalilarabtr/1.0; +https://dalilarabtr.com)';

export interface Rate { value: number; change: number }
export type Rates = {
    usd: Rate | null; eur: Rate | null; sar: Rate | null; gold: Rate | null;
    goldOz?: Rate | null;
    syp?: Rate | null; sypUsd?: Rate | null; sypTry?: Rate | null;
};

function num(v: unknown): number | null {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

async function fromTruncgil(): Promise<{ rates: Rates; updated: string | null } | null> {
    try {
        const res = await fetch('https://finans.truncgil.com/v4/today.json', {
            headers: { 'User-Agent': UA, Accept: 'application/json' },
            signal: AbortSignal.timeout(8000),
            next: { revalidate: REVALIDATE },
        });
        if (!res.ok) return null;
        const d = await res.json() as Record<string, { Selling?: number; Buying?: number; Change?: number }> & { Update_Date?: string };
        const pick = (k: string): Rate | null => {
            const o = d[k];
            if (!o) return null;
            const value = num(o.Selling ?? o.Buying);
            if (value == null) return null;
            return { value, change: num(o.Change) ?? 0 };
        };
        const rates: Rates = { usd: pick('USD'), eur: pick('EUR'), sar: pick('SAR'), gold: pick('GRA'), syp: pick('SYP') };
        if (!rates.usd && !rates.eur) return null;
        return { rates, updated: (d.Update_Date as string) || null };
    } catch {
        return null;
    }
}

async function fromErApi(): Promise<{ rates: Rates; updated: string | null } | null> {
    try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD', {
            headers: { 'User-Agent': UA },
            signal: AbortSignal.timeout(8000),
            next: { revalidate: REVALIDATE },
        });
        if (!res.ok) return null;
        const d = await res.json() as { result?: string; rates?: Record<string, number>; time_last_update_utc?: string };
        const t = d?.rates?.TRY;
        if (d.result !== 'success' || !t) return null;
        const per = (code: string): Rate | null => {
            const r = d.rates?.[code];
            return r ? { value: t / r, change: 0 } : null;
        };
        const rates: Rates = { usd: { value: t, change: 0 }, eur: per('EUR'), sar: per('SAR'), gold: null, syp: per('SYP') };
        return { rates, updated: d.time_last_update_utc || null };
    } catch {
        return null;
    }
}

async function goldFromApi(usdTry: number): Promise<{ gram: Rate; oz: Rate } | null> {
    try {
        const res = await fetch('https://api.gold-api.com/price/XAU', {
            headers: { 'User-Agent': UA, Accept: 'application/json' },
            signal: AbortSignal.timeout(8000),
            next: { revalidate: REVALIDATE },
        });
        if (!res.ok) return null;
        const d = await res.json() as { price?: number };
        const xau = num(d.price); // USD per troy ounce
        if (!xau) return null;
        return {
            gram: { value: (xau / 31.1035) * usdTry, change: 0 }, // gram gold in TRY
            oz: { value: xau, change: 0 },                        // ounce gold in USD
        };
    } catch {
        return null;
    }
}

export interface RatesResult { ok: boolean; rates: Rates; updated: string | null }

/** Fetch + compute the full rates set (fiat + gold + Syrian-pound derivations). */
export async function getRates(): Promise<RatesResult> {
    const data = (await fromTruncgil()) || (await fromErApi());
    if (!data) return { ok: false, rates: { usd: null, eur: null, sar: null, gold: null }, updated: null };
    const rates = data.rates;
    if (rates.usd) {
        const g = await goldFromApi(rates.usd.value);
        if (g) {
            if (!rates.gold) rates.gold = g.gram;
            rates.goldOz = g.oz;
        }
    }
    if (rates.syp && rates.syp.value > 0 && rates.usd) {
        rates.sypUsd = { value: rates.usd.value / rates.syp.value, change: 0 };
        rates.sypTry = { value: 1 / rates.syp.value, change: 0 };
    }
    return { ok: true, rates, updated: data.updated };
}
