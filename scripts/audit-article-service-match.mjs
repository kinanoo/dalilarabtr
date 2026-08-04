// Runs the real matcher over every live article slug so mismatches are found
// by inspection, not by spot-checking five pages.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const REPO = 'C:/Users/Dopara/Downloads/dalilarabtr/.claude/worktrees/focused-varahamihira-6e8168';

// Load the .env for Supabase
const env = {};
for (const line of readFileSync(REPO + '/.env.local', 'utf8').split('\n')) {
    const i = line.indexOf('=');
    if (i > 0 && !line.startsWith('#')) env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
}

// Re-implement the rules by reading the TS source, so we audit exactly what ships.
const src = readFileSync(REPO + '/src/lib/articleServiceMatch.ts', 'utf8');
const slugBlock = src.slice(src.indexOf('const SLUG_RULES'), src.indexOf('const CATEGORY_RULES'));
const catBlock = src.slice(src.indexOf('const CATEGORY_RULES'), src.indexOf('export function matchServiceCategory'));

const SLUG_RULES = [];
for (const m of slugBlock.matchAll(/\[\/(.+?)\/,\s*'([a-z-]+)',\s*'([^']*)'\]/g)) {
    SLUG_RULES.push([new RegExp(m[1]), m[2], m[3]]);
}
const CATEGORY_RULES = {};
for (const m of catBlock.matchAll(/'([^']+)':\s*\['([a-z-]+)',\s*'([^']*)'\]/g)) {
    CATEGORY_RULES[m[1]] = [m[2], m[3]];
}
console.log('rules parsed:', SLUG_RULES.length, 'slug,', Object.keys(CATEGORY_RULES).length, 'category');

function match(slug, category) {
    const bySlug = SLUG_RULES.find(([re]) => re.test(slug));
    if (bySlug) return { slug: bySlug[1], via: 'slug:' + bySlug[0].source.slice(0, 26) };
    const c = category ? CATEGORY_RULES[category] : undefined;
    return c ? { slug: c[0], via: 'category:' + category } : null;
}

const res = await fetch(env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/articles?select=slug,category&limit=1000', {
    headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY, Authorization: 'Bearer ' + env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
});
const rows = await res.json();
console.log('articles:', rows.length);

const byTarget = {};
const unmatched = [];
for (const a of rows) {
    const m = match(a.slug, a.category);
    if (!m) { unmatched.push(a.slug); continue; }
    (byTarget[m.slug] ||= []).push({ slug: a.slug, via: m.via });
}
console.log('\n=== distribution ===');
for (const [t, list] of Object.entries(byTarget).sort((a, b) => b[1].length - a[1].length)) {
    console.log(String(list.length).padStart(4), t);
}
console.log(String(unmatched.length).padStart(4), '(no match → generic block)');

// Suspicious: slug contains a token that contradicts the target
const CONTRA = {
    'real-estate': /car|auto|vehicle|scooter|ehliyet|taxi|tiktak|marti/,
    lawyers: /rent|kira|tenant|housing|dask|aidat|hair|beauty|dental/,
    doctors: /visa|passport|kimlik|residence|work-permit/,
    translators: /car|auto|health|hospital|rent|housing/,
    cars: /rent-contract|tenant/,
    education: /visa/,
};
console.log('\n=== suspicious matches ===');
let bad = 0;
for (const [t, list] of Object.entries(byTarget)) {
    const re = CONTRA[t];
    if (!re) continue;
    for (const x of list) if (re.test(x.slug)) { console.log('  %s -> %s   [%s]', x.slug.padEnd(46), t, x.via); bad++; }
}
console.log('suspicious:', bad);
