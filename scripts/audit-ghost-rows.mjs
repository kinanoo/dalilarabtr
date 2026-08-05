/**
 * Ghost-row guard.
 *
 * A "ghost" is an article that has a redirect in next.config.ts but whose row
 * is still in the database. Its URL bounces to the surviving page, yet the row
 * keeps appearing in category listings, the sitemap and internal search — so we
 * submit URLs to Google that we know will redirect, and show readers cards that
 * jump somewhere else when clicked.
 *
 * Every merge in this repo's history created one, because adding the redirect
 * and deleting the row are two separate steps and only the first is visible in
 * code review. This makes the second one checkable.
 *
 * Run: node scripts/audit-ghost-rows.mjs
 * Exits 1 when a ghost exists, so it can gate a release.
 */
import { readFileSync } from 'node:fs';

/**
 * The one legitimate window in which a ghost exists: the redirect ships with the
 * code, but the row is deleted by a SQL file the site owner runs by hand, and
 * the SQL has to run AFTER the deploy so readers are never sent to a 404. Each
 * entry names the file that clears it, and the check below fails once the row is
 * actually gone — so the entry has to be deleted rather than left to rot.
 */
// Empty is the normal state. Entries live here for one deploy and are removed
// the moment their rows are deleted — which is what the stale check below
// forces.
const RETIRE_EDEVLET = 'sql/2026-08-05_retire_edevlet_template_pages.sql';
const PENDING_SQL = {
    'edevlet-adima-tescilli-arac': RETIRE_EDEVLET,
    'edevlet-adli-sicil-kaydi': RETIRE_EDEVLET,
    'edevlet-adres-degisikligi-bildirimi': RETIRE_EDEVLET,
    'edevlet-aile-hekim-bilgisi-sorgulama': RETIRE_EDEVLET,
    'edevlet-aracimin-cekildigi-otopark-bilgisi-sorgulama': RETIRE_EDEVLET,
    'edevlet-borc-durumu-sorgulama': RETIRE_EDEVLET,
    'edevlet-cimer-basvuru': RETIRE_EDEVLET,
    'edevlet-ck-bogazici-elektrik': RETIRE_EDEVLET,
    'edevlet-dava-dosyasi-sorgulama': RETIRE_EDEVLET,
    'edevlet-dogum-raporu': RETIRE_EDEVLET,
    'edevlet-doviz': RETIRE_EDEVLET,
    'edevlet-e-nabiz': RETIRE_EDEVLET,
    'edevlet-evlenme-ehliyet': RETIRE_EDEVLET,
    'edevlet-ikamet-kisisel-bilgi': RETIRE_EDEVLET,
    'edevlet-imei-sorgulama': RETIRE_EDEVLET,
    'edevlet-iski-su': RETIRE_EDEVLET,
    'edevlet-mhrs': RETIRE_EDEVLET,
    'edevlet-mobil-hat-sorgulama': RETIRE_EDEVLET,
    'edevlet-nvi-nufus-kayit-ornegi': RETIRE_EDEVLET,
    'edevlet-nvi-yerlesim-yeri': RETIRE_EDEVLET,
    'edevlet-operator-debt': RETIRE_EDEVLET,
    'edevlet-plaka-ceza': RETIRE_EDEVLET,
    'edevlet-sgk-hizmet-dokumu': RETIRE_EDEVLET,
    'edevlet-sgk-kayit-belgesi': RETIRE_EDEVLET,
    'edevlet-sirketlerim': RETIRE_EDEVLET,
    'edevlet-surucu-basvuru-durum': RETIRE_EDEVLET,
    'edevlet-surucu-ceza-nokta-belgesi': RETIRE_EDEVLET,
    'edevlet-tapu-harc': RETIRE_EDEVLET,
    'edevlet-tapu-telefon-beyan': RETIRE_EDEVLET,
    'edevlet-tuketici-sikayet': RETIRE_EDEVLET,
    'edevlet-vergi-borcu': RETIRE_EDEVLET,
    'edevlet-webtapu': RETIRE_EDEVLET,
    'edevlet-yol-izin': RETIRE_EDEVLET,
};

const env = Object.fromEntries(
    readFileSync('.env.local', 'utf8')
        .split('\n')
        .filter((l) => l.includes('=') && !l.startsWith('#'))
        .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);

const cfg = readFileSync('next.config.ts', 'utf8');
// Both formatting styles the file uses: single-line entries and the multi-line
// object form. Matching only one of them would silently under-report.
const sources = new Set([
    ...[...cfg.matchAll(/source:\s*'\/article\/([a-z0-9-]+)'/g)].map((m) => m[1]),
]);

const base = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const headers = { apikey: key, Authorization: `Bearer ${key}` };

// Paginate on slug, never on a non-unique column: ordering by something with
// ties lets rows shift between pages, which silently skips some. That is
// exactly how the family-reunion-conditions ghost survived an earlier sweep.
const rows = [];
for (let off = 0; ; off += 100) {
    const res = await fetch(
        `${base}/rest/v1/articles?select=slug&status=eq.approved&order=slug.asc`,
        { headers: { ...headers, Range: `${off}-${off + 99}` } },
    );
    const part = await res.json();
    rows.push(...part);
    if (part.length < 100) break;
}

const live = new Set(rows.map((r) => r.slug));
const ghosts = [...sources].filter((s) => live.has(s));
const pending = ghosts.filter((s) => s in PENDING_SQL);
const real = ghosts.filter((s) => !(s in PENDING_SQL));
// An allowlist entry whose row is already gone has done its job. Left in place
// it would mask a future ghost with the same slug, so it is an error too — that
// is what stops this list from quietly becoming permanent.
const stale = Object.keys(PENDING_SQL).filter((s) => !live.has(s));

console.log(`redirect sources : ${sources.size}`);
console.log(`live articles    : ${live.size}`);

if (pending.length) {
    console.log(`\nawaiting SQL (${pending.length}) — redirect shipped, row deleted by a file the owner runs:`);
    for (const g of pending) console.log(`  ${g}  ←  ${PENDING_SQL[g]}`);
}
if (stale.length) {
    console.error(`\nSTALE ALLOWLIST (${stale.length}) — the row is already gone, remove the entry:`);
    for (const s of stale) console.error(`  ${s}`);
}
if (real.length) {
    console.error(`\nGHOST ROWS (${real.length}) — redirected but still in the database:`);
    for (const g of real) console.error(`  ${g}`);
    console.error('\nDelete these rows, or drop the redirect if the page should stay.');
}
if (real.length || stale.length) process.exit(1);
console.log(pending.length ? '\nno unexpected ghost rows ✓' : '\nno ghost rows ✓');
