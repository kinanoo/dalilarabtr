import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { CONSULTANT_SCENARIOS } from '../src/lib/consultant-scenarios';

// Load env vars
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateScenarios() {
    console.log('🚀 Starting Scenarios Migration...');

    for (const [key, scenario] of Object.entries(CONSULTANT_SCENARIOS)) {
        console.log(`Processing: ${scenario.title} (${key})`);

        const payload = {
            id: key,
            title: scenario.title,
            risk: scenario.risk,
            description: scenario.desc,
            steps: scenario.steps,
            docs: scenario.docs,
            cost: scenario.cost,
            legal: scenario.legal,
            tip: scenario.tip,
            sources: scenario.sources || [],
            article_id: scenario.articleId || null,
            kb_query: scenario.kbQuery || null,
            link: scenario.link || null,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('consultant_scenarios')
            .upsert(payload);

        if (error) {
            console.error(`❌ Error migrating ${key}:`, error);
        } else {
            console.log(`✅ Migrated ${key}`);
        }
    }

    console.log('🎉 Migration Complete!');
}

migrateScenarios();
