import { NextResponse } from 'next/server';

/**
 * Live TRY exchange rates — USD, EUR, SAR, gram gold — for the audience's #1
 * daily-habit check. Fetched server-side, edge-cached, and resilient: each
 * source is isolated in its own try/catch so a failure in one falls through to
 * the next instead of aborting the whole route.
 *
 * Sources (free + keyless):
 *   • primary : finans.truncgil.com  (döviz + gram altın + daily change %)
 *   • fallback: open.er-api.com      (fiat only, USD base — no gold, no change)
 *
 * truncgil can be flaky over TLS from some networks; the fallback guarantees
 * USD/EUR/SAR always render (gram gold only when truncgil answers).
 */
export const runtime = 'nodejs';

const REVALIDATE = 600; // 10 min
const UA = 'Mozilla/5.0 (compatible; dalilarabtr/1.0; +https://dalilarabtr.com)';

interface Rate { value: number; change: number }
type Rates = { usd: Rate | null; eur: Rate | null; sar: Rate | null; gold: Rate | null; goldOz?: Rate | null };

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
        const rates: Rates = { usd: pick('USD'), eur: pick('EUR'), sar: pick('SAR'), gold: pick('GRA') };
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
        // USD base → TRY per unit of X = (USD→TRY) / (USD→X)
        const per = (code: string): Rate | null => {
            const r = d.rates?.[code];
            return r ? { value: t / r, change: 0 } : null;
        };
        const rates: Rates = { usd: { value: t, change: 0 }, eur: per('EUR'), sar: per('SAR'), gold: null };
        return { rates, updated: d.time_last_update_utc || null };
    } catch {
        return null;
    }
}

// Reliable gram-gold fallback: truncgil (which has gram altın) is often
// unreachable from the Cloudflare edge, so compute gram gold in TRY from a
// keyless spot source (XAU USD/oz) × the USD→TRY we already have. One troy
// ounce = 31.1035 g. This tracks the Turkish "gram altın" within ~0.1%.
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

export async function GET() {
    const data = (await fromTruncgil()) || (await fromErApi());
    if (!data) return NextResponse.json({ ok: false }, { status: 200 });
    const rates = data.rates;
    // gold-api gives the ounce in USD always; use it for the ounce, and compute
    // gram gold in TRY from it when the primary source didn't provide gram.
    if (rates.usd) {
        const g = await goldFromApi(rates.usd.value);
        if (g) {
            if (!rates.gold) rates.gold = g.gram;
            rates.goldOz = g.oz;
        }
    }
    return NextResponse.json(
        { ok: true, rates, updated: data.updated },
        { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' } }
    );
}
