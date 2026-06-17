/**
 * Verify Gaziantep zones DB matches the official 2026-06-09 list.
 *
 * Compares the zones table for city='Gaziantep' against the expected
 * counts per district (from the official Nüfus chart):
 *   - Şahinbey       43 closed   / 35 reopened   (78 total)
 *   - Şehitkamil      1 closed   / 24 reopened   (25 total)
 *   - İslahiye        1 closed   / 14 reopened   (15 total)
 *   - Nizip          11 closed   / 10 reopened   (21 total)
 *   - Nurdağı         1 closed   /  2 reopened   ( 3 total)
 *   - Araban          0 closed   /  2 reopened   ( 2 total)
 *   - Karkamış        0 closed   /  8 reopened   ( 8 total)
 *   - Oğuzeli         0 closed   / 11 reopened   (11 total)
 *
 * Totals: 57 closed / 106 reopened / 163 originally closed.
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env.pulled'), override: true });

const supa = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const EXPECTED: Record<string, { closed: number; reopened: number }> = {
    'Şahinbey':    { closed: 43, reopened: 35 },
    'Şehitkamil':  { closed:  1, reopened: 24 },
    'İslahiye':    { closed:  1, reopened: 14 },
    'Nizip':       { closed: 11, reopened: 10 },
    'Nurdağı':     { closed:  1, reopened:  2 },
    'Araban':      { closed:  0, reopened:  2 },
    'Karkamış':    { closed:  0, reopened:  8 },
    'Oğuzeli':     { closed:  0, reopened: 11 },
};

async function main() {
    const all: Array<{ district: string; status: string; neighborhood: string }> = [];
    let from = 0;
    while (true) {
        const { data, error } = await supa
            .from('zones')
            .select('district, status, neighborhood')
            .eq('city', 'Gaziantep')
            .range(from, from + 999);
        if (error) { console.error('fetch error:', error); return; }
        if (!data || data.length === 0) break;
        all.push(...data);
        if (data.length < 1000) break;
        from += 1000;
    }

    console.log(`Loaded ${all.length} Gaziantep zones from DB\n`);

    let totalClosed = 0, totalReopened = 0, mismatches = 0;
    for (const [district, exp] of Object.entries(EXPECTED)) {
        const rows = all.filter(r => r.district === district);
        const closed = rows.filter(r => r.status === 'closed').length;
        const reopened = rows.filter(r => r.status === 'reopened').length;
        const pending = rows.filter(r => r.status === 'pending').length;
        totalClosed += closed;
        totalReopened += reopened;

        const ok = closed === exp.closed && reopened === exp.reopened;
        const marker = ok ? '✓' : '✗';
        if (!ok) mismatches++;
        console.log(
            `${marker} ${district.padEnd(12)} ` +
            `closed=${closed} (exp ${exp.closed})  ` +
            `reopened=${reopened} (exp ${exp.reopened})  ` +
            `pending=${pending}  total=${rows.length}`
        );
    }

    console.log(`\nTOTAL closed=${totalClosed} (exp 57)  reopened=${totalReopened} (exp 106)`);
    console.log(`Mismatched districts: ${mismatches}`);

    // Districts the DB has but our EXPECTED map doesn't (shouldn't happen)
    const known = new Set(Object.keys(EXPECTED));
    const stray = new Set(all.map(r => r.district).filter(d => !known.has(d)));
    if (stray.size) {
        console.log(`\nUnknown districts in DB:`, Array.from(stray));
    }
}

main().catch(e => { console.error(e); process.exit(1); });
