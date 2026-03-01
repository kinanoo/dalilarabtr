import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, serviceKey);

const SQL = `
-- ═══════════════════════════════════════════════════════════
-- 1. Content Performance — top 15 articles by views (30 days)
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION get_content_performance()
RETURNS TABLE(
    article_id UUID,
    title TEXT,
    slug TEXT,
    page_views BIGINT,
    avg_duration INTEGER,
    comment_count BIGINT,
    published_at TIMESTAMPTZ
)
LANGUAGE sql STABLE
SECURITY DEFINER
AS $$
    WITH article_views AS (
        SELECT
            SUBSTRING(e.page_path FROM '/article/(.+)$') as art_slug,
            COUNT(*) as views
        FROM analytics_events e
        WHERE e.event_name = 'page_view'
          AND e.page_path LIKE '/article/%'
          AND e.created_at > NOW() - INTERVAL '30 days'
        GROUP BY art_slug
    ),
    article_durations AS (
        SELECT
            SUBSTRING(e.page_path FROM '/article/(.+)$') as art_slug,
            COALESCE(AVG(e.duration_seconds) FILTER (WHERE e.duration_seconds BETWEEN 5 AND 3600), 0)::INTEGER as avg_dur
        FROM analytics_events e
        WHERE e.event_name = 'session_end'
          AND e.page_path LIKE '/article/%'
          AND e.created_at > NOW() - INTERVAL '30 days'
        GROUP BY art_slug
    ),
    article_comments AS (
        SELECT
            c.entity_id::UUID as art_id,
            COUNT(*) as cnt
        FROM comments c
        WHERE c.entity_type = 'article'
          AND c.status = 'approved'
        GROUP BY c.entity_id
    )
    SELECT
        a.id as article_id,
        a.title,
        a.slug,
        COALESCE(av.views, 0) as page_views,
        COALESCE(ad.avg_dur, 0) as avg_duration,
        COALESCE(ac.cnt, 0) as comment_count,
        a.created_at as published_at
    FROM articles a
    LEFT JOIN article_views av ON av.art_slug = a.slug OR av.art_slug = a.id::TEXT
    LEFT JOIN article_durations ad ON ad.art_slug = a.slug OR ad.art_slug = a.id::TEXT
    LEFT JOIN article_comments ac ON ac.art_id = a.id
    WHERE a.status = 'published' OR a.is_active = true
    ORDER BY COALESCE(av.views, 0) DESC
    LIMIT 15;
$$;

-- ═══════════════════════════════════════════════════════════
-- 2. Period Comparison — this week vs last week
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION get_period_comparison()
RETURNS JSON
LANGUAGE sql STABLE
SECURITY DEFINER
AS $$
    WITH this_week AS (
        SELECT
            COUNT(DISTINCT COALESCE(NULLIF(ip_hash,''), visitor_id)) as visitors,
            COUNT(*) FILTER (WHERE event_name = 'page_view') as views,
            COALESCE(AVG(duration_seconds) FILTER (WHERE event_name = 'session_end' AND duration_seconds BETWEEN 5 AND 3600), 0)::INTEGER as avg_duration
        FROM analytics_events
        WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)
    ),
    last_week AS (
        SELECT
            COUNT(DISTINCT COALESCE(NULLIF(ip_hash,''), visitor_id)) as visitors,
            COUNT(*) FILTER (WHERE event_name = 'page_view') as views,
            COALESCE(AVG(duration_seconds) FILTER (WHERE event_name = 'session_end' AND duration_seconds BETWEEN 5 AND 3600), 0)::INTEGER as avg_duration
        FROM analytics_events
        WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '7 days'
          AND created_at < DATE_TRUNC('week', CURRENT_DATE)
    )
    SELECT json_build_object(
        'this_week_visitors', tw.visitors,
        'last_week_visitors', lw.visitors,
        'visitors_change_pct', CASE WHEN lw.visitors > 0
            THEN ROUND(((tw.visitors - lw.visitors)::NUMERIC / lw.visitors) * 100)
            ELSE 0 END,
        'this_week_views', tw.views,
        'last_week_views', lw.views,
        'views_change_pct', CASE WHEN lw.views > 0
            THEN ROUND(((tw.views - lw.views)::NUMERIC / lw.views) * 100)
            ELSE 0 END,
        'this_week_avg_duration', tw.avg_duration,
        'last_week_avg_duration', lw.avg_duration,
        'duration_change_pct', CASE WHEN lw.avg_duration > 0
            THEN ROUND(((tw.avg_duration - lw.avg_duration)::NUMERIC / lw.avg_duration) * 100)
            ELSE 0 END
    )
    FROM this_week tw, last_week lw;
$$;

-- ═══════════════════════════════════════════════════════════
-- 3. Spike Metrics — detect traffic anomalies
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION get_spike_metrics()
RETURNS JSON
LANGUAGE sql STABLE
SECURITY DEFINER
AS $$
    WITH active_now AS (
        SELECT COUNT(DISTINCT COALESCE(NULLIF(ip_hash,''), visitor_id)) as cnt
        FROM analytics_events
        WHERE created_at > NOW() - INTERVAL '5 minutes'
          AND event_name = 'page_view'
    ),
    hourly_avg AS (
        SELECT COALESCE(AVG(hourly_count), 0)::NUMERIC as avg_hourly
        FROM (
            SELECT
                DATE_TRUNC('hour', created_at) as hr,
                COUNT(DISTINCT COALESCE(NULLIF(ip_hash,''), visitor_id)) as hourly_count
            FROM analytics_events
            WHERE created_at > NOW() - INTERVAL '30 days'
              AND event_name = 'page_view'
            GROUP BY hr
        ) hourly
    )
    SELECT json_build_object(
        'active_now', an.cnt,
        'avg_hourly_30d', ROUND(ha.avg_hourly),
        'spike_threshold', ROUND(ha.avg_hourly * 2),
        'is_spiking', an.cnt > (ha.avg_hourly * 2) AND ha.avg_hourly > 0,
        'spike_pct', CASE WHEN ha.avg_hourly > 0
            THEN ROUND(((an.cnt - ha.avg_hourly) / ha.avg_hourly) * 100)
            ELSE 0 END
    )
    FROM active_now an, hourly_avg ha;
$$;
`;

async function run() {
    console.log('Creating analytics v2 RPCs...');
    console.log('  - get_content_performance()');
    console.log('  - get_period_comparison()');
    console.log('  - get_spike_metrics()');

    const { error } = await supabase.rpc('exec_sql', { sql: SQL });

    if (error) {
        console.log('\nexec_sql not available. Please run this SQL manually in Supabase SQL Editor:\n');
        console.log(SQL);
        console.log('\nCopy the SQL above and paste it in:');
        console.log('Supabase Dashboard -> SQL Editor -> New Query -> Paste -> Run');
        process.exit(1);
    }

    console.log('\n✅ All RPCs created successfully!');
}

run().catch(console.error);
