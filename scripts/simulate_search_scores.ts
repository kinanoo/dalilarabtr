
import { intelligentTokenize } from '../src/lib/intelligentSearch';
import { normalizeArabic } from '../src/lib/arabicSearch';

// MOCK DATA similar to what is likely in the app
const MOCK_ITEMS = [
    {
        id: 'convert-kimlik',
        title: 'تحويل الكملك إلى إقامة (سياحية/عائلية) — شرط ختم دخول قبل 2016',
        haystack: 'تحويل الكملك إلى إقامة سياحية عائلية شرط ختم دخول قبل 2016 تاشيرة فيزا اقامة'
    },
    {
        id: 'bank-account',
        title: 'فتح حساب بنكي لحامل كملك (أصفر) — ما المتوقع',
        haystack: 'فتح حساب بنكي لحامل كملك أصفر ما المتوقع زراعات بنك اقامة عمل جواز سفر'
    }
];

const QUERY = "بدي حول كملك لإقامة";

function calculateScore(item: any, query: string) {
    const trimmed = query.trim();
    const { originalTokens, expandedTokens } = intelligentTokenize(trimmed);
    const needle = normalizeArabic(trimmed);

    console.log(`\n--- Scoring Item: ${item.title} ---`);
    console.log(`Tokens: ${originalTokens.join(', ')}`);
    console.log(`Expanded: ${expandedTokens.join(', ')}`);

    let score = 0;

    // 1. Exact Substring Match
    if (item.haystack.includes(needle)) {
        score += 50;
        console.log(`+50 (Exact Needle)`);
    }

    // 2. ROBUST TOKEN MATCHING
    const allTokensMatch = originalTokens.every(token => {
        const t = normalizeArabic(token);
        return t.length < 2 || item.haystack.includes(t);
    });

    if (allTokensMatch && originalTokens.length > 0) {
        console.log(`[x] All Tokens Matched!`);

        const allTokensInTitle = originalTokens.every(token => {
            const t = normalizeArabic(token);
            // DEBUG: Check match against title
            const match = normalizeArabic(item.title).includes(t);
            console.log(`   - Token '${t}' in title? ${match}`);
            return match;
        });

        if (allTokensInTitle) {
            score += 150;
            console.log(`+150 (All in Title)`);
        } else {
            score += 40;
            console.log(`+40 (All in Body)`);
        }
    } else {
        console.log(`[ ] Not all tokens matched.`);
        originalTokens.forEach(token => {
            const t = normalizeArabic(token);
            if (!item.haystack.includes(t)) console.log(`    Missing: ${t}`);
        });
    }

    // 3. Partial Token Matching
    originalTokens.forEach(token => {
        const tokenNorm = normalizeArabic(token);
        if (tokenNorm.length < 2) return;
        if (item.haystack.includes(tokenNorm)) {
            let partial = 10;
            if (normalizeArabic(item.title).includes(tokenNorm)) partial += 15;
            score += partial;
            console.log(`+${partial} (Partial: ${token})`);
        }
    });

    // 4. Expanded/Synonym Matching
    expandedTokens.forEach(term => {
        const termNorm = normalizeArabic(term);
        if (termNorm.length < 2) return;

        // Don't double count if it's strictly equal to an original token we already counted?
        // The original logic doesn't prevent double counting stems vs synonyms if they overlap.
        if (item.haystack.includes(termNorm)) {
            score += 5;
            // console.log(`+5 (Synonym: ${term})`);
        }
    });

    console.log(`TOTAL SCORE: ${score}`);
    return score;
}

// Run Simulation
console.log(`Query: "${QUERY}"`);
MOCK_ITEMS.forEach(item => calculateScore(item, QUERY));
