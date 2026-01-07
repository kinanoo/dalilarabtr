
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('Supabase URL:', supabaseUrl ? 'Found ✅' : 'Missing ❌');
console.log('Supabase Key:', supabaseServiceKey ? 'Found ✅' : 'Missing ❌');

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Credentials missing in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateZones() {
    try {
        const jsonPath = path.join(process.cwd(), 'public/data/closed-areas.json');
        console.log(`Reading JSON from: ${jsonPath}`);

        if (!fs.existsSync(jsonPath)) {
            console.error('JSON file not found!');
            process.exit(1);
        }

        const rawData = fs.readFileSync(jsonPath, 'utf8');
        const data = JSON.parse(rawData);

        if (!data.items || !Array.isArray(data.items)) {
            console.error('Invalid JSON format: expected "items" array.');
            process.exit(1);
        }

        console.log(`Found ${data.items.length} zones to migrate.`);
        console.log('Clearing existing zones table...');

        // Optional: Clear table first to avoid duplicates if re-running
        const { error: deleteError } = await supabase.from('zones').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        if (deleteError) {
            console.error('Error clearing table:', deleteError);
        }

        console.log('Inserting data in batches...');

        const batchSize = 100;
        const total = data.items.length;

        for (let i = 0; i < total; i += batchSize) {
            const batch = data.items.slice(i, i + batchSize).map((item: any) => ({
                city: item.c,
                district: item.d,
                neighborhood: item.n,
                name: item.n,
                is_banned: true
            }));

            const { error } = await supabase.from('zones').insert(batch);

            if (error) {
                console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
            } else {
                console.log(`Inserted batch ${i}-${Math.min(i + batchSize, total)}`);
            }
        }

        console.log('Migration completed successfully!');

    } catch (err) {
        console.error('Migration failed:', err);
    }
}

migrateZones();
