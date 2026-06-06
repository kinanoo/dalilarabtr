/**
 * Mark zones as 'reopened' for every Şanlıurfa + Konya neighborhood that
 * was lifted from the closed-neighborhoods list on 6 June 2026.
 *
 * Source data: official Şanlıurfa Migration Office list (26 remaining
 * closed) + UCSO Konya list (4 remaining closed). Everything else in those
 * two provinces is now open. Rows that should stay closed are listed
 * explicitly below; everything else gets flipped.
 *
 * Other provinces' lists haven't been officially released yet, so we leave
 * their zones marked `closed` and surface an explanation in the UI.
 */
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env.pulled', override: true });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Names as stored in the DB include the " MAHALLESİ" suffix; we strip it
// when matching so the editor-facing list below stays readable.
function normalize(s) {
    return (s || '')
        .toLocaleUpperCase('tr')
        .replace(/MAHALLESİ$/, '')
        .replace(/MAH\.?$/, '')
        .trim();
}

// 26 neighborhoods that REMAIN closed in Şanlıurfa after 6 June 2026.
const URFA_STILL_CLOSED = [
    // Akçakale (7)
    ['Akçakale', 'YENİ'],
    ['Akçakale', 'FEVZİ ÇAKMAK'],
    ['Akçakale', 'ADNAN MENDERES'],
    ['Akçakale', 'SÜLEYMANŞAH'],
    ['Akçakale', 'ATATÜRK'],
    ['Akçakale', 'GÜLVEREN'],
    ['Akçakale', 'GÜNDAŞ'],
    // Birecik (1)
    ['Birecik', 'MERKEZ'],
    // Eyyübiye (4)
    ['Eyyübiye', 'EYÜPKENT'],
    ['Eyyübiye', 'KARAKOYUNLU'],
    ['Eyyübiye', 'KADIOĞLU'],
    ['Eyyübiye', 'TÜRKMEYDANI'],
    // Haliliye (9)
    ['Haliliye', 'BAĞLARBAŞI'],
    ['Haliliye', 'HIZMALI'],
    ['Haliliye', 'MİMAR SİNAN'],
    ['Haliliye', 'SULTAN FATİH'],
    ['Haliliye', 'ATATÜRK'],
    ['Haliliye', 'KAMBERİYE'],
    ['Haliliye', 'BAHÇELİEVLER'],
    ['Haliliye', 'ŞEHİTLİK'],
    ['Haliliye', 'CENGİZ TOPEL'],
    // Harran (1)
    ['Harran', 'SELAHADDİN EYYUBİ'],
    // Suruç (4)
    ['Suruç', 'HÜRRİYET'],
    ['Suruç', 'YILDIRIM'],
    ['Suruç', 'DİKİLİ'],
    ['Suruç', 'AYDIN'],
];

// 4 neighborhoods that REMAIN closed in Konya after the same update.
const KONYA_STILL_CLOSED = [
    ['Meram', 'SAHİBATA'],
    ['Karatay', 'ŞEMSİTEBRİZİ'],
    ['Selçuklu', 'İHSANİYE'],
    ['Selçuklu', 'FERHUNİYE'],
];

function buildKeySet(pairs) {
    const set = new Set();
    for (const [district, neighborhood] of pairs) {
        set.add(`${normalize(district)}|${normalize(neighborhood)}`);
    }
    return set;
}

async function updateProvince(provinceLike, stillClosedSet, label) {
    // Pull every row for this province.
    const { data: rows, error } = await supabase
        .from('zones')
        .select('id, city, district, neighborhood, status')
        .ilike('city', `%${provinceLike}%`);
    if (error) throw new Error(`fetch ${label}: ${error.message}`);

    let toReopen = [];
    let stayClosed = 0;
    let alreadyReopened = 0;

    for (const r of rows || []) {
        const key = `${normalize(r.district)}|${normalize(r.neighborhood)}`;
        if (stillClosedSet.has(key)) {
            stayClosed++;
            continue;
        }
        if (r.status === 'reopened') {
            alreadyReopened++;
            continue;
        }
        toReopen.push(r.id);
    }

    // Batch update — Supabase's `in` filter takes the list inline.
    if (toReopen.length > 0) {
        // Chunk to stay well under URL/postgrest payload limits.
        const CHUNK = 200;
        for (let i = 0; i < toReopen.length; i += CHUNK) {
            const ids = toReopen.slice(i, i + CHUNK);
            const { error: updErr } = await supabase
                .from('zones')
                .update({ status: 'reopened', reopened_at: new Date('2026-06-06').toISOString() })
                .in('id', ids);
            if (updErr) throw new Error(`update ${label}: ${updErr.message}`);
        }
    }

    console.log(`${label}:`);
    console.log(`  ${toReopen.length} rows flipped → reopened`);
    console.log(`  ${stayClosed} rows kept closed`);
    console.log(`  ${alreadyReopened} rows were already reopened`);
}

(async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 Updating zones for 6 June 2026 lift');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // The reopened_at column may not exist yet — try a no-op update first to
    // probe. If it errors, ask the user to run the schema migration. Cleaner
    // than silently writing without the column.
    const { error: probeErr } = await supabase
        .from('zones')
        .update({ reopened_at: null })
        .eq('id', '00000000-0000-0000-0000-000000000000');
    if (probeErr && /reopened_at/.test(probeErr.message)) {
        console.error('\n❌ Column reopened_at is missing. Run this SQL first in Supabase:\n');
        console.error('ALTER TABLE public.zones ADD COLUMN IF NOT EXISTS reopened_at timestamptz;');
        console.error('CREATE INDEX IF NOT EXISTS zones_reopened_at_idx ON public.zones (reopened_at DESC) WHERE status = \'reopened\';\n');
        process.exit(1);
    }

    try {
        await updateProvince('Urfa', buildKeySet(URFA_STILL_CLOSED), 'Şanlıurfa');
        await updateProvince('Konya', buildKeySet(KONYA_STILL_CLOSED), 'Konya');
    } catch (err) {
        console.error('\n❌', err.message);
        process.exit(1);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Done.');
    process.exit(0);
})();
