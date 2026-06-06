/**
 * Migrate all articles whose `steps` column contains objects of the shape
 * { title, description } into plain strings of the form "title — description".
 *
 * Background: the admin Article Manager form treats steps as a flat string
 * array (<input value={step} />) and the older public article view assumed
 * the same. Recent publishing scripts mistakenly wrote {title, description}
 * objects, which the public view rendered as raw JSON literals (the user
 * spotted this in production). The public view has been hardened to accept
 * both shapes defensively, but the canonical storage format is plain
 * strings — that keeps the admin form, the consultant client, and the
 * analyst engine consistent across the codebase.
 */
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env.pulled', override: true });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

function normalizeStep(s) {
    // The `steps` column is text[] in Postgres. When publish scripts pushed
    // {title, description} objects the Supabase JS client silently
    // JSON.stringified each one into the array — so what looks like a
    // string entry may actually be `{"title":"...","description":"..."}`.
    // We detect that shape and unpack it back into a flat "title — desc".
    if (typeof s === 'string') {
        const trimmed = s.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    const t = typeof parsed.title === 'string' ? parsed.title.trim() : '';
                    const d = typeof parsed.description === 'string' ? parsed.description.trim() : '';
                    if (t && d) return `${t} — ${d}`;
                    return t || d || trimmed;
                }
            } catch {
                // Not valid JSON — leave the string alone.
            }
        }
        return s;
    }
    if (s && typeof s === 'object') {
        const t = typeof s.title === 'string' ? s.title.trim() : '';
        const d = typeof s.description === 'string' ? s.description.trim() : '';
        if (t && d) return `${t} — ${d}`;
        return t || d || '';
    }
    return '';
}

(async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 Normalizing object-format steps → strings');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const { data, error } = await supabase
        .from('articles')
        .select('id, steps')
        .not('steps', 'is', null);

    if (error) {
        console.error('❌ failed to load articles:', error.message);
        process.exit(1);
    }

    let touched = 0;
    let untouched = 0;
    for (const row of data || []) {
        const steps = row.steps;
        if (!Array.isArray(steps) || steps.length === 0) {
            untouched++;
            continue;
        }
        // Skip only if every entry is already a CLEAN plain string —
        // i.e. not a JSON-encoded object lurking in string clothing.
        const looksJsonObj = (s) =>
            typeof s === 'string' && s.trim().startsWith('{') && s.trim().endsWith('}');
        const needsWork = steps.some((s) => typeof s !== 'string' || looksJsonObj(s));
        if (!needsWork) {
            untouched++;
            continue;
        }
        const normalized = steps.map(normalizeStep).filter((s) => s.length > 0);
        const { error: updErr } = await supabase
            .from('articles')
            .update({ steps: normalized })
            .eq('id', row.id);
        if (updErr) {
            console.error(`  ❌ ${row.id}: ${updErr.message}`);
        } else {
            console.log(`  ✅ ${row.id}: ${steps.length} steps normalized`);
            touched++;
        }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Done — ${touched} articles updated, ${untouched} skipped (already strings or empty).`);
    process.exit(0);
})();
