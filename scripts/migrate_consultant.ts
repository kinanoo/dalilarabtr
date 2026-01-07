
import { createClient } from '@supabase/supabase-js';
import { CONSULTANT_SCENARIOS } from '../src/lib/consultant-scenarios';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log("Starting migration...");
    let count = 0;
    const entries = Object.entries(CONSULTANT_SCENARIOS);

    for (const [key, scenario] of entries) {
        console.log(`Processing: ${key} - ${scenario.title}`);

        const articlePayload = {
            id: key,
            title: scenario.title,
            category: 'consultant',
            intro: scenario.desc,
            details: scenario.title + ' ' + scenario.desc, // Fill details with something
            steps: scenario.steps || [],
            documents: scenario.docs || [],
            fees: scenario.cost || '',
            source: scenario.legal || '',
            warning: scenario.risk === 'safe' ? null : `Risk Level: ${scenario.risk.toUpperCase()}`,
            tips: scenario.tip ? [scenario.tip] : [],
            created_at: new Date().toISOString(),
            image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80', // Generic law image
            last_update: scenario.lastUpdate || new Date().toISOString()
        };

        const { error } = await supabase
            .from('articles')
            .upsert(articlePayload, { onConflict: 'id' });

        if (error) {
            console.error(`❌ Error ${key}: ${error.message}`);
        } else {
            console.log(`✅ Migrated ${key}`);
            count++;
        }
    }
    console.log(`Done. Migrated ${count} scenarios.`);
}

migrate();
