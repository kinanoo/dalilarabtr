import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, serviceKey);

const SQL = `
CREATE OR REPLACE FUNCTION get_active_visitors()
RETURNS TABLE(
    visitor_id TEXT,
    page_path TEXT,
    ip_country TEXT,
    ip_city TEXT,
    device TEXT,
    browser TEXT,
    os TEXT,
    referrer TEXT,
    last_seen TIMESTAMPTZ,
    page_views BIGINT
)
LANGUAGE sql STABLE
SECURITY DEFINER
AS $$
    WITH latest AS (
        SELECT DISTINCT ON (e.visitor_id)
            e.visitor_id,
            e.page_path,
            e.ip_country,
            e.ip_city,
            e.meta->>'device' as device,
            e.meta->>'browser' as browser,
            e.meta->>'os' as os,
            e.meta->>'referrer' as referrer,
            e.created_at as last_seen
        FROM analytics_events e
        WHERE e.created_at > NOW() - INTERVAL '5 minutes'
          AND e.event_name = 'page_view'
        ORDER BY e.visitor_id, e.created_at DESC
    ),
    counts AS (
        SELECT visitor_id, COUNT(*) as page_views
        FROM analytics_events
        WHERE created_at > NOW() - INTERVAL '5 minutes'
          AND event_name = 'page_view'
        GROUP BY visitor_id
    )
    SELECT l.*, c.page_views
    FROM latest l
    JOIN counts c ON l.visitor_id = c.visitor_id
    ORDER BY l.last_seen DESC;
$$;
`;

async function run() {
    console.log('Creating get_active_visitors() RPC...');

    const { error } = await supabase.rpc('exec_sql', { sql: SQL });

    if (error) {
        // Fallback: try via REST SQL endpoint
        console.log('exec_sql not available, trying direct SQL...');

        const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': serviceKey,
                'Authorization': `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({ sql: SQL }),
        });

        if (!res.ok) {
            console.log('Direct RPC failed. Please run this SQL manually in Supabase SQL Editor:\n');
            console.log(SQL);
            console.log('\nCopy the SQL above and paste it in:');
            console.log('Supabase Dashboard → SQL Editor → New Query → Paste → Run');
            process.exit(1);
        }
    }

    console.log('✅ get_active_visitors() created successfully!');

    // Test it
    const { data, error: testErr } = await supabase.rpc('get_active_visitors');
    if (testErr) {
        console.log('⚠️  Test call failed:', testErr.message);
    } else {
        console.log(`✅ Test passed — ${data?.length || 0} active visitors found`);
    }
}

run().catch(console.error);
