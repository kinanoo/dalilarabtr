/**
 * 🔍 مساعد البحث الذكي (Intelligent Search Helper)
 * ===================================================
 * 
 * Function helper لاستخدامها في أي مكون
 */

import { normalizeArabic } from './arabicSearch';
import { intelligentTokenize } from './intelligentSearch';

/**
 * فلترة ذكية للمصفوفات باستخدام البحث الذكي
 * @param items - المصفوفة المراد بحثها
 * @param query - نص البحث
 * @param getSearchText - دالة لاستخراج النص من كل item
 * @param minScore - الحد الأدنى للنقاط (افتراضي: 15)
 */
export function intelligentFilter<T>(
    items: T[],
    query: string,
    getSearchText: (item: T) => string,
    minScore: number = 15
): T[] {
    const trimmed = query.trim();
    if (!trimmed) return items;

    const { originalTokens, expandedTokens, contextKeywords } = intelligentTokenize(trimmed);
    const needle = normalizeArabic(trimmed);

    const scored: Array<{ item: T; score: number }> = [];

    for (const item of items) {
        const searchText = normalizeArabic(getSearchText(item));
        let score = 0;
        let hasOriginalKeyword = false;

        // الكلمات الأصلية (must have!)
        originalTokens.forEach(token => {
            const tokenNorm = normalizeArabic(token);
            if (searchText.includes(tokenNorm)) {
                hasOriginalKeyword = true;
                score += 25;
            }
        });

        if (!hasOriginalKeyword) continue;

        // المترادفات
        expandedTokens.forEach(term => {
            if (!originalTokens.includes(term)) {
                const termNorm = normalizeArabic(term);
                if (searchText.includes(termNorm)) {
                    score += 8;
                }
            }
        });

        // Context
        contextKeywords.forEach(kw => {
            if (searchText.includes(normalizeArabic(kw))) {
                score += 5;
            }
        });

        // Exact phrase
        if (searchText.includes(needle)) {
            score += 30;
        }

        if (score >= minScore) {
            scored.push({ item, score });
        }
    }

    return scored
        .sort((a, b) => b.score - a.score)
        .map(x => x.item);
}

/**
 * فحص ما إذا كان النص يطابق البحث الذكي
 */
export function intelligentMatch(
    text: string,
    query: string,
    minScore: number = 15
): boolean {
    const trimmed = query.trim();
    if (!trimmed) return true;

    const { originalTokens, expandedTokens } = intelligentTokenize(trimmed);
    const textNorm = normalizeArabic(text);
    const needle = normalizeArabic(trimmed);

    let score = 0;
    let hasOriginalKeyword = false;

    originalTokens.forEach(token => {
        if (textNorm.includes(normalizeArabic(token))) {
            hasOriginalKeyword = true;
            score += 25;
        }
    });

    if (!hasOriginalKeyword) return false;

    expandedTokens.forEach(term => {
        if (!originalTokens.includes(term)) {
            if (textNorm.includes(normalizeArabic(term))) {
                score += 8;
            }
        }
    });

    if (textNorm.includes(needle)) {
        score += 30;
    }

    return score >= minScore;
}
