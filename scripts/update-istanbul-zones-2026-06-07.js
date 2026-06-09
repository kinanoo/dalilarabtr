/**
 * Update Istanbul zones — official list released 7 June 2026.
 *
 * Only 5 neighborhoods remain CLOSED in all of Istanbul:
 *   - Esenyurt / KOZA MAHALLESİ
 *   - Esenyurt / ZAFER MAHALLESİ
 *   - Avcılar / ÜNİVERSİTE MAHALLESİ
 *   - Küçükçekmece / BEŞYOL MAHALLESİ
 *   - Fatih / MOLLA HÜSREV MAHALLESİ
 *
 * Everything else in the city flips to status='reopened' with
 * reopened_at = today. Names not present in the existing DB (e.g.
 * ÜNİVERSİTE in Avcılar may be new) get inserted.
 */
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env.pulled', override: true });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

function normalize(s) {
    return (s || '')
        .toLocaleUpperCase('tr')
        .replace(/MAHALLESİ$/, '')
        .replace(/MAH\.?$/, '')
        .trim();
}

const ISTANBUL_STILL_CLOSED = [
    ['Esenyurt', 'KOZA'],
    ['Esenyurt', 'ZAFER'],
    ['Avcılar', 'ÜNİVERSİTE'],
    ['Küçükçekmece', 'BEŞYOL'],
    ['Fatih', 'MOLLA HÜSREV'],
];

function buildKeySet(pairs) {
    const set = new Set();
    for (const [district, neighborhood] of pairs) {
        set.add(`${normalize(district)}|${normalize(neighborhood)}`);
    }
    return set;
}

(async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 Updating Istanbul zones — 7 June 2026');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const stillClosed = buildKeySet(ISTANBUL_STILL_CLOSED);

    // 1. Pull every Istanbul row (cover variant spellings: İstanbul / Istanbul)
    const { data: rows, error } = await supabase
        .from('zones')
        .select('id, city, district, neighborhood, status')
        .or('city.ilike.%stanbul%,city.ilike.%İstanbul%');
    if (error) {
        console.error('❌ fetch:', error.message);
        process.exit(1);
    }
    console.log(`Found ${rows?.length || 0} existing Istanbul rows`);

    const toReopen = [];
    let staying = 0;
    let already = 0;
    const matchedKeys = new Set();

    for (const r of rows || []) {
        const key = `${normalize(r.district)}|${normalize(r.neighborhood)}`;
        if (stillClosed.has(key)) {
            staying++;
            matchedKeys.add(key);
            // Make sure it's marked 'closed' (in case it was previously
            // flipped to 'reopened' by a stale script).
            if (r.status !== 'closed') {
                await supabase.from('zones').update({ status: 'closed', reopened_at: null }).eq('id', r.id);
                console.log(`  ✓ reverted to closed: ${r.district}/${r.neighborhood}`);
            }
            continue;
        }
        if (r.status === 'reopened') {
            already++;
            continue;
        }
        toReopen.push(r.id);
    }

    if (toReopen.length > 0) {
        const CHUNK = 200;
        for (let i = 0; i < toReopen.length; i += CHUNK) {
            const ids = toReopen.slice(i, i + CHUNK);
            const { error: e } = await supabase
                .from('zones')
                .update({ status: 'reopened', reopened_at: new Date('2026-06-07').toISOString() })
                .in('id', ids);
            if (e) {
                console.error(`❌ batch update: ${e.message}`);
                process.exit(1);
            }
        }
    }

    // 2. Insert any missing rows from the still-closed list (e.g. names
    // not in DB before). Use the canonical city spelling 'İstanbul'.
    const allKeys = new Set([...stillClosed].map((k) => k));
    const missingKeys = [...allKeys].filter((k) => !matchedKeys.has(k));
    if (missingKeys.length > 0) {
        const inserts = [];
        for (const k of missingKeys) {
            const [district, neighborhood] = k.split('|');
            // Find canonical pair from original input
            const orig = ISTANBUL_STILL_CLOSED.find(([d, n]) => normalize(d) === district && normalize(n) === neighborhood);
            if (!orig) continue;
            inserts.push({
                city: 'İstanbul',
                district: orig[0],
                neighborhood: `${orig[1]} MAHALLESİ`,
                status: 'closed',
            });
        }
        if (inserts.length > 0) {
            const { error: insErr } = await supabase.from('zones').insert(inserts);
            if (insErr) {
                console.error(`⚠️  insert missing: ${insErr.message}`);
            } else {
                inserts.forEach((r) =>
                    console.log(`  ✓ inserted missing: ${r.district}/${r.neighborhood}`)
                );
            }
        }
    }

    console.log(`\nFlipped to reopened: ${toReopen.length}`);
    console.log(`Stayed closed: ${staying}`);
    console.log(`Already reopened (untouched): ${already}`);

    // Final counts
    const { count: c } = await supabase
        .from('zones')
        .select('*', { count: 'exact', head: true })
        .or('city.ilike.%stanbul%,city.ilike.%İstanbul%')
        .eq('status', 'closed');
    const { count: r } = await supabase
        .from('zones')
        .select('*', { count: 'exact', head: true })
        .or('city.ilike.%stanbul%,city.ilike.%İstanbul%')
        .eq('status', 'reopened');
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Istanbul final: closed=${c} · reopened=${r}`);
    process.exit(0);
})();
