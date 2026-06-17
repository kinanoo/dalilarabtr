/**
 * Backfill: any approved article whose `slug` column is NULL gets
 * `slug = id`. The carousel's "اقرأ التفاصيل" CTA produced
 * /article/null because FeaturedNewsHero's query selected slug only,
 * and at least one freshly-published row had slug=null.
 *
 * Mirroring id → slug stabilizes the canonical URL and matches what
 * the admin's article save now does for future inserts. Existing
 * non-null slugs are left untouched — admins sometimes set short
 * English slugs for SEO and we must not overwrite them.
 *
 * Idempotent: re-running is a no-op once every row has a slug.
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env.pulled'), override: true });

const supa = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main() {
    const { data: rows, error } = await supa
        .from('articles')
        .select('id, slug, title, status')
        .is('slug', null);

    if (error) { console.error('fetch failed:', error); process.exit(1); }
    if (!rows || rows.length === 0) {
        console.log('No rows with slug=NULL. Already backfilled.');
        return;
    }

    console.log(`Found ${rows.length} rows with slug=NULL:`);
    for (const r of rows) {
        console.log(`  ${r.id}  status=${r.status}  title="${r.title?.slice(0, 60)}"`);
    }

    let fixed = 0, failed = 0;
    for (const r of rows) {
        const { error: updateErr } = await supa
            .from('articles')
            .update({ slug: r.id })
            .eq('id', r.id);
        if (updateErr) {
            console.error(`✗ ${r.id}: ${updateErr.message}`);
            failed++;
        } else {
            fixed++;
        }
    }
    console.log(`\nFixed ${fixed}, failed ${failed}.`);
}

main().catch(e => { console.error(e); process.exit(1); });
