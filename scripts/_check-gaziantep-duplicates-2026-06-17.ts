/**
 * Find any Gaziantep zone-related article rows so we can clean up
 * duplicates the admin may have accidentally created when copy-pasting
 * raw HTML into the editor (which escaped the tags and rendered as text).
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
    const { data, error } = await supa
        .from('articles')
        .select('id, slug, title, status, created_at, last_update')
        .or('id.ilike.%gaziantep%,id.ilike.%عنتاب%,title.ilike.%عنتاب%,title.ilike.%الأحياء%')
        .order('created_at', { ascending: false });

    if (error) { console.error('error:', error); process.exit(1); }
    console.log(`Found ${data?.length || 0} matching rows:\n`);
    for (const r of data || []) {
        console.log(`  id=${r.id}`);
        console.log(`  slug=${r.slug}`);
        console.log(`  title="${r.title}"`);
        console.log(`  status=${r.status}  last_update=${r.last_update}  created=${r.created_at}`);
        console.log('');
    }
}

main().catch(e => { console.error(e); process.exit(1); });
