/**
 * One-shot Supabase data backup utility.
 *
 * Why not pg_dump? Supabase's direct Postgres password isn't in our env;
 * we only have the service_role JWT. So this script uses the REST API
 * over service_role to:
 *
 *   1. List every public table via information_schema.
 *   2. Pull every row with .select('*') in 1000-row chunks.
 *   3. Write the result as both:
 *        - one big {table → rows[]} JSON (full data, easy to diff/inspect)
 *        - SQL INSERT statements (restorable straight into any Postgres)
 *
 * Schema is NOT included — every CREATE TABLE / RLS policy lives in
 * sql/*.sql in the repo, and Supabase Dashboard → Database → Backups
 * also takes a nightly schema+data dump for paid plans. This script is
 * the application-level safety net that survives even a paranoid scenario
 * where Supabase project is deleted and we rebuild from scratch.
 *
 * Output: scripts/_backups/<UTC-timestamp>.json
 *         scripts/_backups/<UTC-timestamp>.sql
 *
 * The backups directory is git-ignored — the dumps contain PII (member
 * emails, push subscriptions, etc) and have no business in a public repo.
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env.pulled'), override: true });

const supa = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: { persistSession: false, autoRefreshToken: false },
    },
);

const OUT_DIR = path.resolve(__dirname, '_backups');

// Tables we know exist — derived from sql/ files + admin/ai route.ts table list.
// Listing explicitly (not via information_schema) because:
//   - Supabase doesn't expose information_schema over PostgREST without
//     a custom RPC, and we don't want to add one just for backups.
//   - Explicit list = predictable backup; new tables get added here on
//     purpose (you see what you're backing up).
const TABLES = [
    'articles',
    'service_providers',
    'service_reviews',
    'review_replies',
    'review_reports',
    'review_helpful_votes',
    'service_categories',
    'consultant_scenarios',
    'security_codes',
    'faqs',
    'updates',
    'zones',
    'site_banners',
    'site_settings',
    'site_menus',
    'site_testimonials',
    'home_cards',
    'news_ticker',
    'official_sources',
    'member_profiles',
    'comments',
    'notifications',
    'notification_reads',
    'content_suggestions',
    'content_votes',
    'article_feedback',
    'analytics_events',
    'analyst_insights',
    'admin_activity_log',
    'admin_login_attempts',
    'push_subscriptions',
    'newsletter_subscribers',
    'questions',
    'tools_registry',
];

interface TableDump {
    table: string;
    rowCount: number;
    rows: Record<string, unknown>[];
    error?: string;
}

async function dumpTable(table: string): Promise<TableDump> {
    const all: Record<string, unknown>[] = [];
    let from = 0;
    const step = 1000;

    while (true) {
        const { data, error } = await supa
            .from(table)
            .select('*')
            .range(from, from + step - 1);

        if (error) {
            // 42P01 = table doesn't exist → skip silently (table is in
            // our list but not deployed yet)
            if ((error as { code?: string }).code === '42P01') {
                return { table, rowCount: 0, rows: [], error: 'table-not-exists' };
            }
            return { table, rowCount: 0, rows: [], error: error.message };
        }
        if (!data || data.length === 0) break;
        all.push(...data);
        if (data.length < step) break;
        from += step;
    }
    return { table, rowCount: all.length, rows: all };
}

function escapeSqlString(value: unknown): string {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (value instanceof Date) return `'${value.toISOString()}'`;
    if (Array.isArray(value)) {
        // Postgres array literal: '{a,b,c}' — but for arbitrary JSON-like
        // content we wrap as a JSON string and let the caller cast on
        // restore. Safer than getting Postgres array escaping wrong.
        return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
    }
    if (typeof value === 'object') {
        return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
    }
    return `'${String(value).replace(/'/g, "''")}'`;
}

function dumpToSql(dumps: TableDump[]): string {
    const lines: string[] = [];
    lines.push('-- Supabase data backup');
    lines.push(`-- Generated: ${new Date().toISOString()}`);
    lines.push(`-- Tables: ${dumps.filter(d => !d.error).length} / ${dumps.length}`);
    lines.push('-- Restore: psql DATABASE_URL -f <this-file>');
    lines.push('-- NOTE: Schema NOT included. Apply sql/*.sql migrations first.');
    lines.push('');
    lines.push('BEGIN;');
    lines.push('');

    for (const d of dumps) {
        lines.push(`-- ===== ${d.table} (${d.rowCount} rows${d.error ? ' — ' + d.error : ''}) =====`);
        if (d.error || d.rowCount === 0) {
            lines.push('');
            continue;
        }
        const cols = Object.keys(d.rows[0]);
        for (const row of d.rows) {
            const values = cols.map(c => escapeSqlString(row[c]));
            lines.push(`INSERT INTO "${d.table}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});`);
        }
        lines.push('');
    }

    lines.push('COMMIT;');
    return lines.join('\n');
}

async function main() {
    if (!fs.existsSync(OUT_DIR)) {
        fs.mkdirSync(OUT_DIR, { recursive: true });
        console.log(`Created ${OUT_DIR}`);
    }

    // Stamp without `:` for Windows filesystem friendliness.
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').replace(/Z$/, 'Z');

    console.log(`Dumping ${TABLES.length} tables...\n`);
    const dumps: TableDump[] = [];

    for (const table of TABLES) {
        process.stdout.write(`  ${table.padEnd(28)} ... `);
        const result = await dumpTable(table);
        dumps.push(result);
        if (result.error) {
            console.log(`(${result.error})`);
        } else {
            console.log(`${result.rowCount} rows`);
        }
    }

    const totalRows = dumps.reduce((acc, d) => acc + d.rowCount, 0);
    const okCount = dumps.filter(d => !d.error).length;

    // JSON form — easy to grep / inspect / re-process
    const jsonPath = path.join(OUT_DIR, `${stamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify({
        generatedAt: new Date().toISOString(),
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        totalTables: dumps.length,
        successTables: okCount,
        totalRows,
        tables: dumps.reduce<Record<string, { rowCount: number; rows: Record<string, unknown>[]; error?: string }>>((acc, d) => {
            acc[d.table] = { rowCount: d.rowCount, rows: d.rows, ...(d.error ? { error: d.error } : {}) };
            return acc;
        }, {}),
    }, null, 2));

    // SQL form — straight into psql for restore
    const sqlPath = path.join(OUT_DIR, `${stamp}.sql`);
    fs.writeFileSync(sqlPath, dumpToSql(dumps));

    const jsonSize = fs.statSync(jsonPath).size;
    const sqlSize = fs.statSync(sqlPath).size;

    console.log('');
    console.log(`✓ Total rows: ${totalRows.toLocaleString('en-US')}`);
    console.log(`✓ JSON: ${jsonPath} (${(jsonSize / 1024).toFixed(1)} KB)`);
    console.log(`✓ SQL:  ${sqlPath} (${(sqlSize / 1024).toFixed(1)} KB)`);
    console.log('');
    console.log('Restore later via: psql $DATABASE_URL -f ' + sqlPath);
}

main().catch(err => {
    console.error('Backup failed:', err);
    process.exit(1);
});
