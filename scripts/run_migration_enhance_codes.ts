import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('Adding new columns to security_codes...');

    // Test by updating a single row with the new fields
    // If columns don't exist, this will fail — then user needs to run SQL manually
    const { error } = await supabase
        .from('security_codes')
        .update({
            how_to_remove: null,
            duration: null,
            related_codes: null,
        })
        .eq('code', 'V68')
        .select('code');

    if (error) {
        if (error.message.includes('how_to_remove') || error.message.includes('duration') || error.message.includes('related_codes')) {
            console.log('Columns do not exist yet. Running SQL migration via RPC...');

            // Try using rpc to run raw SQL
            const { error: rpcError } = await supabase.rpc('exec_sql', {
                query: `
                    ALTER TABLE public.security_codes
                      ADD COLUMN IF NOT EXISTS how_to_remove TEXT,
                      ADD COLUMN IF NOT EXISTS duration TEXT,
                      ADD COLUMN IF NOT EXISTS related_codes TEXT[];
                `
            });

            if (rpcError) {
                console.log('RPC not available. Please run the following SQL in Supabase SQL Editor:');
                console.log('');
                console.log(`ALTER TABLE public.security_codes`);
                console.log(`  ADD COLUMN IF NOT EXISTS how_to_remove TEXT,`);
                console.log(`  ADD COLUMN IF NOT EXISTS duration TEXT,`);
                console.log(`  ADD COLUMN IF NOT EXISTS related_codes TEXT[];`);
                console.log('');
                console.log('File: src/lib/migrations/enhance_security_codes.sql');
                return false;
            }
            console.log('Migration completed via RPC!');
            return true;
        }
        console.error('Unexpected error:', error.message);
        return false;
    }

    console.log('Columns already exist! Migration not needed.');
    return true;
}

runMigration().then(ok => {
    if (ok) console.log('Done!');
    else console.log('Migration needs manual SQL execution.');
});
