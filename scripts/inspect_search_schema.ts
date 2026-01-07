
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectSchema() {
    const tables = ['security_codes', 'articles', 'site_banners'];

    console.log('Inspecting schemas...');

    for (const table of tables) {
        // Fetch one row to see structure
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.error(`Error fetching ${table}:`, error.message);
            continue;
        }
        if (data && data.length > 0) {
            console.log(`\n--- ${table} Columns ---`);
            console.log(Object.keys(data[0]));
        } else {
            console.log(`\n--- ${table} (Empty Table) ---`);
            // Can't infer columns easily from empty table without using admin API or specific Postgrest features, 
            // but usually we have data. If empty, I'll rely on my knowledge or try to insert dummy to fail.
        }
    }
}

inspectSchema();
