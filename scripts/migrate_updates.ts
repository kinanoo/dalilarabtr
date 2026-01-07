import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { LATEST_UPDATES } from '../src/lib/constants';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase URL or Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateUpdates() {
    console.log('🚀 Migrating Updates...');

    for (const update of LATEST_UPDATES) {
        // Check if update exists by Title
        const { data: existing } = await supabase
            .from('updates')
            .select('id')
            .eq('title', update.title)
            .single();

        if (existing) {
            console.log(`ℹ️ Update already exists: ${update.title}`);
            continue;
        }

        const payload = {
            title: update.title,
            type: update.type,
            content: update.content,
            created_at: update.date ? new Date(update.date).toISOString() : new Date().toISOString(),
            active: true
        };

        const { error } = await supabase.from('updates').insert(payload);

        if (error) console.error(`❌ Error update ${update.title}:`, error.message);
        else console.log(`✅ Migrated: ${update.title}`);
    }

    console.log('🏁 Migration Complete');
}

migrateUpdates();
