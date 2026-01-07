
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
    const list = [
        { table: 'articles', columns: ['title', 'content', 'description'] },
        { table: 'service_providers', columns: ['name', 'description', 'profession'] },
        { table: 'faqs', columns: ['question', 'answer'] },
        { table: 'security_codes', columns: ['code', 'title', 'description'] },
        { table: 'zones', columns: ['city', 'district', 'neighborhood'] },
        { table: 'official_sources', columns: ['name', 'category'] },
        { table: 'updates', columns: ['title', 'content'] },
        { table: 'site_banners', columns: ['title', 'position'] },
        { table: 'suggestions', columns: ['name', 'message'] }
    ];

    console.log('Checking tables existence and read access...');

    for (const item of list) {
        try {
            const { data, error } = await supabase
                .from(item.table)
                .select(item.columns.join(','))
                .limit(1);

            if (error) {
                console.error(`❌ Table '${item.table}' Error:`, error.message);
            } else {
                console.log(`✅ Table '${item.table}' OK.`);
            }
        } catch (e: any) {
            console.error(`❌ Table '${item.table}' Exception:`, e.message);
        }
    }
}

checkTables();
