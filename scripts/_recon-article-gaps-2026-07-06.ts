import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function main() {
    // Pull every article title/slug/category to build a dedup corpus for gap analysis.
    const all: { title: string; slug: string; category: string | null; status: string | null }[] = [];
    const pageSize = 1000;
    for (let from = 0; ; from += pageSize) {
        const { data, error } = await supabase
            .from('articles')
            .select('title, slug, category, status')
            .range(from, from + pageSize - 1);
        if (error) { console.error(error.message); process.exit(1); }
        if (!data || data.length === 0) break;
        all.push(...(data as typeof all));
        if (data.length < pageSize) break;
    }

    // Category histogram
    const byCat: Record<string, number> = {};
    for (const a of all) byCat[a.category || 'null'] = (byCat[a.category || 'null'] || 0) + 1;

    const byStatus: Record<string, number> = {};
    for (const a of all) byStatus[a.status || 'null'] = (byStatus[a.status || 'null'] || 0) + 1;

    console.log('TOTAL articles:', all.length);
    console.log('BY STATUS:', JSON.stringify(byStatus));
    console.log('BY CATEGORY:', JSON.stringify(byCat, null, 0));

    fs.writeFileSync('scripts/_article-corpus.json', JSON.stringify(all, null, 0));
    // Also a plain title list for quick human/LLM scan
    fs.writeFileSync('scripts/_article-titles.txt', all.map((a) => `${a.category || '-'}\t${a.title}`).join('\n'));
    console.log('WROTE scripts/_article-corpus.json + _article-titles.txt');
}
main();
