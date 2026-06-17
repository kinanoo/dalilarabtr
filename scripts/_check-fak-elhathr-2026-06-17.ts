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
        .select('id, slug, title, status, created_at, details')
        .ilike('id', '%الأحياء-التي-تم%')
        .order('created_at', { ascending: false });

    if (error) { console.error('error:', error); process.exit(1); }
    console.log(`Found ${data?.length || 0} matching rows:\n`);
    for (const r of data || []) {
        console.log(`  id=${r.id}`);
        console.log(`  title="${r.title}"`);
        console.log(`  status=${r.status}  created=${r.created_at}`);
        console.log(`  details head: ${r.details?.slice(0, 150).replace(/\n/g, ' ')}...`);
        console.log('');
    }
}

main().catch(e => { console.error(e); process.exit(1); });
