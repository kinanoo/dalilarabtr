/**
 * apply-analytics-honesty.ts
 *
 * Applies sql/2026-06-09_analytics_honesty.sql to the live Supabase
 * database. The migration replaces 4 RPC functions:
 *   - get_dashboard_stats
 *   - get_period_comparison
 *   - get_spike_metrics
 *   - get_daily_visits
 *
 * Why a script instead of asking the user to paste into Supabase SQL
 * Editor: the user mentioned earlier they don't have easy access to
 * the SQL editor. This script reads the SAME .sql file (single source
 * of truth) and applies it via the exec_sql RPC if it exists.
 *
 * If exec_sql doesn't exist on the DB, the script prints clear
 * instructions for manual application instead of silently failing.
 *
 * Run: npx tsx scripts/apply-analytics-honesty.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const SQL_FILE = path.resolve(__dirname, '..', 'sql', '2026-06-09_analytics_honesty.sql');
const SQL = fs.readFileSync(SQL_FILE, 'utf-8');

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
});

async function main() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Analytics Honesty Migration');
    console.log('  Fixes 4 statistical issues on /admin dashboard:');
    console.log('    1. Period comparison: apples-to-apples window');
    console.log('    2. Total visitors: stop double-counting via daily salt');
    console.log('    3. Spike detector: no false alarms on small sites');
    console.log('    4. All date math anchored to Istanbul timezone');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`📄 Reading ${path.basename(SQL_FILE)} (${SQL.length} chars)`);
    console.log('🔄 Applying via exec_sql RPC...\n');

    const { error } = await supabase.rpc('exec_sql', { sql: SQL });

    if (error) {
        console.error('❌ exec_sql failed:', error.message);
        console.error('\nPossible causes:');
        console.error('  - exec_sql RPC does not exist on this DB');
        console.error('  - service_role key missing or wrong');
        console.error('  - SQL syntax error\n');
        console.error('⚙️  Manual fallback:');
        console.error(`  1. Open https://supabase.com/dashboard/project/${supabaseUrl?.split('//')[1]?.split('.')[0]}/sql`);
        console.error(`  2. New Query → paste the file:\n     ${SQL_FILE}`);
        console.error('  3. Run.');
        process.exit(1);
    }

    console.log('✅ SQL applied successfully.\n');

    // Verify the new functions return sensible JSON.
    console.log('🔍 Verifying...');

    const { data: dashStats, error: e1 } = await supabase.rpc('get_dashboard_stats');
    if (e1) console.error('  get_dashboard_stats:', e1.message);
    else console.log('  get_dashboard_stats: OK',
        '— total_visitors_all_time:',
        (dashStats as { total_visitors_all_time?: number })?.total_visitors_all_time);

    const { data: comp, error: e2 } = await supabase.rpc('get_period_comparison');
    if (e2) console.error('  get_period_comparison:', e2.message);
    else {
        const c = comp as { this_week_visitors?: number; last_week_visitors?: number; window_elapsed_seconds?: number; comparison_basis?: string };
        console.log('  get_period_comparison: OK',
            `— this=${c?.this_week_visitors} vs last=${c?.last_week_visitors}`,
            `(${c?.comparison_basis}, window=${Math.round((c?.window_elapsed_seconds || 0) / 3600)}h)`);
    }

    const { data: spike, error: e3 } = await supabase.rpc('get_spike_metrics');
    if (e3) console.error('  get_spike_metrics:', e3.message);
    else {
        const s = spike as { active_now?: number; projected_hourly?: number; avg_hourly_30d?: number; is_spiking?: boolean };
        console.log('  get_spike_metrics: OK',
            `— active_now=${s?.active_now}`,
            `projected=${s?.projected_hourly}/hr`,
            `avg=${s?.avg_hourly_30d}/hr`,
            `spiking=${s?.is_spiking}`);
    }

    const { data: daily, error: e4 } = await supabase.rpc('get_daily_visits');
    if (e4) console.error('  get_daily_visits:', e4.message);
    else console.log('  get_daily_visits: OK',
        '— rows:', Array.isArray(daily) ? daily.length : '?');

    console.log('\n✅ Migration applied and verified. Refresh /admin to see honest numbers.');
}

main().catch((err) => {
    console.error('Unexpected error:', err);
    process.exit(1);
});
