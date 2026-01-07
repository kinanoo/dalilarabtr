
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { OFFICIAL_SOURCES, TOOLS_MENU, QUICK_ACTIONS } from '../src/lib/constants';
import { CONSULTANT_SCENARIOS } from '../src/lib/consultant-scenarios';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase URL or Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateOfficialSources() {
    console.log('🚀 Migrating Official Sources...');

    const payload = OFFICIAL_SOURCES.map((s: any) => {
        // Exclude ID, force category
        const { id, ...rest } = s;
        return {
            name: s.name,
            url: s.url,
            description: s.desc || s.description,
            category: 'official',
            icon: 'Link'
        };
    });

    const quickLinks = QUICK_ACTIONS.filter(q => q.href.startsWith('http')).map((q: any) => {
        // Exclude ID
        const { id, ...rest } = q;
        return {
            name: q.title,
            url: q.href,
            description: q.desc,
            category: 'quick_action',
            icon: 'Zap'
        };
    });

    const allSources = [...payload, ...quickLinks];

    for (const source of allSources) {
        // UPSERT based on 'name' (Unique Constraint Added via SQL)
        const { error } = await supabase
            .from('official_sources')
            .upsert(source, { onConflict: 'name' as any });

        if (error) console.error(`❌ Error migrating source ${source.name}:`, error.message);
    }

    console.log(`✅ Processed ${allSources.length} sources.`);
}

async function migrateTools() {
    console.log('🚀 Migrating Tools Registry...');

    const tools = [
        ...TOOLS_MENU.map((t: any) => {
            const key = t.href.replace('/tools/', '').replace('/', '-');
            return {
                key: key,
                name: t.name,
                route: t.href,
                active: true, // Force boolean
                description: 'أداة مساعدة'
            };
        }),
        ...QUICK_ACTIONS.filter(q => q.href.startsWith('/')).map((q: any) => {
            const key = q.href.replace('/', '');
            return {
                key: key,
                name: q.title,
                route: q.href,
                description: q.desc,
                active: true // Force boolean
            };
        })
    ];

    for (const tool of tools) {
        // UPSERT based on 'key'
        const { error } = await supabase
            .from('tools_registry')
            .upsert(tool, { onConflict: 'key' as any });

        if (error) console.error(`❌ Error tool ${tool.name}:`, error.message);
    }
    console.log(`✅ Processed ${tools.length} tools.`);
}

async function migrateConsultantScenarios() {
    console.log('🚀 Migrating Consultant Scenarios...');

    // Map object to array
    const scenarios = Object.entries(CONSULTANT_SCENARIOS).map(([key, data]: [string, any]) => ({
        id: key,
        title: data.title,
        description: data.desc,
        risk_level: data.risk,
        steps: data.steps,
        required_docs: data.docs,
        cost_info: data.cost,
        legal_ref: data.legal,
        pro_tip: data.tip
    }));

    for (const scenario of scenarios) {
        const { error } = await supabase
            .from('consultant_scenarios')
            .upsert(scenario, { onConflict: 'id' as any });

        if (error) console.error(`❌ Error migrating scenario ${scenario.id}:`, error.message);
    }
    console.log(`✅ Processed ${scenarios.length} scenarios.`);
}

/* 
// Deprecated: No longer migrating MOCK services to prevent overwriting real data
async function migrateServices() {
    console.log('⚠️ Services migration skipped (MOCK_PROVIDERS removed)');
}
*/

async function run() {
    await migrateOfficialSources();
    await migrateTools();
    await migrateConsultantScenarios();
    // await migrateServices();
    console.log('🎉 All Static Data Migrated!');
}

run();
