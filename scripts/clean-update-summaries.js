/**
 * Remove rich-text markup accidentally stored in updates.summary.
 *
 * Safe by default: run without arguments for a dry run, then pass --apply.
 */
require('dotenv').config({ path: process.env.DOTENV_PATH || '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const applyChanges = process.argv.includes('--apply');

if (!url || !serviceKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
}

const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

const namedEntities = {
    amp: '&', apos: "'", gt: '>', lt: '<', nbsp: ' ', quot: '"',
};

function decodeEntities(value) {
    return value.replace(/&(#x[\da-f]+|#\d+|[a-z][\da-z]+);/gi, (entity, code) => {
        if (code[0] !== '#') return namedEntities[code.toLowerCase()] ?? entity;
        const hex = code[1]?.toLowerCase() === 'x';
        const numericValue = Number.parseInt(code.slice(hex ? 2 : 1), hex ? 16 : 10);
        if (!Number.isFinite(numericValue) || numericValue < 0 || numericValue > 0x10ffff) return '';
        if (numericValue >= 0xd800 && numericValue <= 0xdfff) return '';
        return String.fromCodePoint(numericValue);
    });
}

function toPlainText(value) {
    let text = String(value || '');
    for (let pass = 0; pass < 3; pass += 1) {
        text = decodeEntities(text)
            .replace(/<!--[\s\S]*?-->/g, ' ')
            .replace(/<\s*(script|style|template|noscript|iframe|object)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, ' ')
            .replace(/<\s*\/?\s*(?:address|article|aside|blockquote|br|dd|div|dl|dt|fieldset|figcaption|figure|footer|form|h[1-6]|header|hr|li|main|nav|ol|p|pre|section|table|tbody|td|tfoot|th|thead|tr|ul)\b[^>]*>/gi, ' ')
            .replace(/<[^>]*>/g, ' ')
            .replace(/[<>]/g, ' ');
    }
    return decodeEntities(text).replace(/[\u00a0\u2007\u202f]/g, ' ').replace(/\s+/g, ' ').trim();
}

async function main() {
    const { data, error } = await supabase
        .from('updates')
        .select('id,title,summary')
        .not('summary', 'is', null)
        .order('date', { ascending: false })
        .limit(5000);

    if (error) throw error;

    const changed = (data || [])
        .map((row) => ({ ...row, cleanSummary: toPlainText(row.summary) }))
        .filter((row) => row.cleanSummary !== row.summary);

    console.log(`${applyChanges ? 'APPLY' : 'DRY RUN'}: ${changed.length} of ${(data || []).length} update summaries need cleanup.`);
    for (const row of changed) {
        console.log(`- ${row.id}: ${row.title}`);
        if (!applyChanges) continue;

        const { error: updateError } = await supabase
            .from('updates')
            .update({ summary: row.cleanSummary })
            .eq('id', row.id);
        if (updateError) throw updateError;
    }

    if (applyChanges) console.log(`Updated ${changed.length} summaries.`);
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
