
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- Checking Database Content ---');

    const tables = ['articles', 'service_providers', 'updates', 'home_cards'];

    for (const table of tables) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) console.error(`Error checking ${table}:`, error.message);
        else console.log(`${table} count: ${count}`);
    }

    console.log('\n--- Testing Search "إقامة" ---');
    const { data, error } = await supabase
        .from('articles')
        .select('id, title')
        .or(`title.ilike.%إقامة%,details.ilike.%إقامة%`)
        .limit(5);

    if (error) console.error('Search error:', error);
    else console.log('Search results:', data);
}

check();
