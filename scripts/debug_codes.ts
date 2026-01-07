
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectCodes() {
    console.log('Fetching security codes...');
    const { data, error } = await supabase
        .from('security_codes')
        .select('*')
        .limit(20);

    if (error) {
        console.error('Error fetching codes:', error);
        return;
    }

    console.log('Found codes:', data?.length);
    data?.forEach(code => {
        console.log(`ID: ${code.id} | Code: "${code.code}" | Title: "${code.title}"`);
    });

    // Try a specific search test
    const searchTerm = '87';
    console.log(`\nTesting search for "${searchTerm}"...`);
    const { data: searchResults, error: searchError } = await supabase
        .from('security_codes')
        .select('*')
        .or(`code.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%`);

    if (searchError) console.error('Search error:', searchError);
    else {
        console.log(`Search found ${searchResults.length} matches.`);
        searchResults.forEach(res => console.log(`MATCH: ${res.code} - ${res.title}`));
    }
}

inspectCodes();
