import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/adminAuth';
import { sanitizeSearchQuery } from '@/lib/analyticsPrivacy';
import logger from '@/lib/logger';

export const runtime = 'nodejs';

const MAX_ROWS = 5000;

type AnalyticsRow = {
  event_name: string;
  meta: Record<string, unknown> | null;
};

type QueryBucket = {
  query: string;
  searches: number;
  zeroResults: number;
  clicks: number;
};

export async function GET(request: Request) {
  try {
    const gate = await requireAdmin();
    if (!gate.ok) return gate.res;

    const url = new URL(request.url);
    const days = Math.min(90, Math.max(1, Number(url.searchParams.get('days')) || 30));
    const since = new Date(Date.now() - days * 86_400_000).toISOString();
    const eventNames = [
      'search',
      'search_result_click',
      'pwa_shown',
      'pwa_dismissed',
      'pwa_accepted',
      'pwa_declined',
      'pwa_installed',
    ];

    const { data, error } = await gate.svc
      .from('analytics_events')
      .select('event_name, meta, created_at')
      .in('event_name', eventNames)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(MAX_ROWS);

    if (error) {
      logger.error('admin/search-insights read failed:', error);
      return NextResponse.json({ error: 'read_failed' }, { status: 500 });
    }

    const rows = (data || []) as AnalyticsRow[];
    const queries = new Map<string, QueryBucket>();
    const pwa = { shown: 0, dismissed: 0, accepted: 0, declined: 0, installed: 0 };
    let searches = 0;
    let zeroResults = 0;
    let clicks = 0;

    const bucketFor = (raw: unknown) => {
      const query = sanitizeSearchQuery(raw).toLocaleLowerCase('ar');
      if (!query) return null;
      const bucket = queries.get(query) || { query, searches: 0, zeroResults: 0, clicks: 0 };
      queries.set(query, bucket);
      return bucket;
    };

    for (const row of rows) {
      const meta = row.meta || {};
      if (row.event_name === 'search') {
        const bucket = bucketFor(meta.query);
        if (!bucket) continue;
        searches++;
        bucket.searches++;
        if (meta.outcome === 'zero' || meta.result_count === 0) {
          zeroResults++;
          bucket.zeroResults++;
        }
      } else if (row.event_name === 'search_result_click') {
        const bucket = bucketFor(meta.query);
        if (!bucket) continue;
        clicks++;
        bucket.clicks++;
      } else if (row.event_name.startsWith('pwa_')) {
        const key = row.event_name.slice(4) as keyof typeof pwa;
        if (key in pwa) pwa[key]++;
      }
    }

    const ranked = [...queries.values()]
      .sort((a, b) => b.searches - a.searches || b.zeroResults - a.zeroResults);
    const needs = [...queries.values()]
      .filter((item) => item.zeroResults > 0)
      .sort((a, b) => b.zeroResults - a.zeroResults || b.searches - a.searches)
      .slice(0, 10);

    return NextResponse.json({
      ok: true,
      days,
      samples: rows.length,
      truncated: rows.length >= MAX_ROWS,
      summary: {
        searches,
        zeroResults,
        zeroRate: searches ? Math.round((zeroResults / searches) * 1000) / 10 : 0,
        clicks,
        clickRate: searches ? Math.round((clicks / searches) * 1000) / 10 : 0,
      },
      topSearches: ranked.slice(0, 10),
      needs,
      pwa,
    });
  } catch (error) {
    logger.error('admin/search-insights unhandled:', error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
