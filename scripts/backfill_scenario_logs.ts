import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// IDs of the 22 new scenarios that need activity log entries
const NEW_SCENARIO_IDS = [
    'tourist-new', 'tourist-extension', 'tourist-convert-kimlik',
    'tourist-overstay', 'tourist-reject', 'legal-deport',
    'tourist-bank-open', 'bank-block', 'debt-check',
    'daily-goc-appointment', 'daily-nvi-appointment',
    'daily-uets', 'daily-cimer', 'daily-uyap',
    'daily-mhrs-booking', 'daily-family-doctor', 'daily-family-doctor-change',
    'housing-rent-increase', 'housing-deposit', 'housing-eviction',
    'housing-tahliye-undertaking', 'daily-bank-open'
];

async function backfillLogs() {
    console.log('🚀 Backfilling activity logs for new scenarios...\n');

    // Fetch scenario data from DB
    const { data: scenarios, error } = await supabase
        .from('consultant_scenarios')
        .select('id, title, description')
        .in('id', NEW_SCENARIO_IDS);

    if (error || !scenarios) {
        console.error('Failed to fetch scenarios:', error);
        process.exit(1);
    }

    // Check which ones already have log entries (avoid duplicates)
    const { data: existingLogs } = await supabase
        .from('admin_activity_log')
        .select('entity_id')
        .eq('event_type', 'new_scenario')
        .in('entity_id', NEW_SCENARIO_IDS);

    const alreadyLogged = new Set((existingLogs || []).map(l => l.entity_id));

    let inserted = 0;
    let skipped = 0;

    for (const s of scenarios) {
        if (alreadyLogged.has(s.id)) {
            console.log(`⏭️  Already logged: ${s.id}`);
            skipped++;
            continue;
        }

        const { error: insertError } = await supabase
            .from('admin_activity_log')
            .insert({
                event_type: 'new_scenario',
                title: 'سيناريو جديد: ' + (s.title || 'بدون عنوان'),
                detail: (s.description || '').substring(0, 100),
                entity_id: s.id,
                entity_table: 'consultant_scenarios'
            });

        if (insertError) {
            console.error(`❌ Error logging ${s.id}:`, insertError.message);
        } else {
            console.log(`✅ Logged: ${s.title} (${s.id})`);
            inserted++;
        }
    }

    console.log(`\n🎉 Done! Inserted: ${inserted}, Skipped: ${skipped}`);
}

backfillLogs();
