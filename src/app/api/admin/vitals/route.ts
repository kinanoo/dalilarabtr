import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/adminAuth';
import logger from '@/lib/logger';

/**
 * GET /api/admin/vitals — first-party Core Web Vitals summary.
 *
 * Reads the `web_vital` rows written by <WebVitals /> (one row per page view,
 * anonymous, no visitor id) out of analytics_events and aggregates them the way
 * Google does: the 75th percentile, not the average. An average hides the slow
 * tail — p75 is the number that decides whether a URL group passes CWV.
 *
 * Returns the site-wide p75 per metric plus the worst pages by LCP, so the
 * answer is always "these specific pages are slow", never just "the site is slow".
 * Pages with too few samples are excluded: a p75 over 3 page views is noise.
 */
export const runtime = 'nodejs';

const MIN_SAMPLES_PER_PAGE = 8;
const MAX_ROWS = 5000;

type MetaShape = {
    lcp?: number; cls?: number; inp?: number; fcp?: number; ttfb?: number;
    conn?: string;
};

/** 75th percentile (nearest-rank). Returns null for an empty set. */
function p75(values: number[]): number | null {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.75) - 1);
    return sorted[Math.max(0, idx)];
}

const round = (n: number | null, dp = 0): number | null =>
    n == null ? null : Math.round(n * 10 ** dp) / 10 ** dp;

export async function GET(request: Request) {
    try {
        const gate = await requireAdmin();
        if (!gate.ok) return gate.res;

        const url = new URL(request.url);
        const days = Math.min(90, Math.max(1, Number(url.searchParams.get('days')) || 28));
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

        const { data, error } = await gate.svc
            .from('analytics_events')
            .select('page_path, meta, created_at')
            .eq('event_name', 'web_vital')
            .gte('created_at', since)
            .order('created_at', { ascending: false })
            .limit(MAX_ROWS);

        if (error) {
            logger.error('admin/vitals read failed:', error);
            return NextResponse.json({ error: 'read_failed' }, { status: 500 });
        }

        const rows = (data || []) as { page_path: string | null; meta: MetaShape | null }[];

        const all: Record<string, number[]> = { lcp: [], cls: [], inp: [], fcp: [], ttfb: [] };
        const byPage = new Map<string, { lcp: number[]; cls: number[]; inp: number[]; n: number }>();
        const byConn = new Map<string, number[]>(); // effectiveType → LCP samples

        for (const r of rows) {
            const m = r.meta || {};
            for (const k of Object.keys(all)) {
                const v = (m as Record<string, unknown>)[k];
                if (typeof v === 'number' && Number.isFinite(v)) all[k].push(v);
            }
            const path = r.page_path || '(unknown)';
            const bucket = byPage.get(path) || { lcp: [], cls: [], inp: [], n: 0 };
            bucket.n++;
            if (typeof m.lcp === 'number') bucket.lcp.push(m.lcp);
            if (typeof m.cls === 'number') bucket.cls.push(m.cls);
            if (typeof m.inp === 'number') bucket.inp.push(m.inp);
            byPage.set(path, bucket);

            if (m.conn && typeof m.lcp === 'number') {
                const arr = byConn.get(m.conn) || [];
                arr.push(m.lcp);
                byConn.set(m.conn, arr);
            }
        }

        const overall = {
            lcp: round(p75(all.lcp)),
            cls: round(p75(all.cls), 3),
            inp: round(p75(all.inp)),
            fcp: round(p75(all.fcp)),
            ttfb: round(p75(all.ttfb)),
        };

        // Worst pages by p75 LCP — the actionable list. Only pages with enough
        // samples to be meaningful.
        const pages = [...byPage.entries()]
            .filter(([, b]) => b.n >= MIN_SAMPLES_PER_PAGE && b.lcp.length > 0)
            .map(([path, b]) => ({
                path,
                samples: b.n,
                lcp: round(p75(b.lcp)),
                cls: round(p75(b.cls), 3),
                inp: round(p75(b.inp)),
            }))
            .sort((a, b) => (b.lcp || 0) - (a.lcp || 0))
            .slice(0, 12);

        const connections = [...byConn.entries()]
            .map(([conn, arr]) => ({ conn, samples: arr.length, lcp: round(p75(arr)) }))
            .sort((a, b) => b.samples - a.samples)
            .slice(0, 5);

        return NextResponse.json({
            ok: true,
            days,
            samples: rows.length,
            truncated: rows.length >= MAX_ROWS,
            overall,
            pages,
            connections,
        });
    } catch (err) {
        logger.error('admin/vitals unhandled:', err);
        return NextResponse.json({ error: 'internal_error' }, { status: 500 });
    }
}
