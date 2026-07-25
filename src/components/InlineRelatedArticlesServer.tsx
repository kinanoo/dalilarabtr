// src/components/InlineRelatedArticlesServer.tsx
//
// Server Component. The original InlineRelatedArticles is 'use client' and
// fetches in a useEffect, so it contributed NOTHING to the server HTML — and
// it sits mid-article, which is the strongest internal-link position on the
// page. This variant fetches on the server so the links are in the first
// response, the way RelatedArticles already does at the foot of the page.
//
// Offset matters: RelatedArticles runs the same category query ordered by
// last_update and takes the first three. Without an offset both blocks would
// render the identical three cards twice in one article. This one takes the
// NEXT three, so the two blocks never overlap. A category with three or fewer
// other articles renders nothing here rather than repeating the footer block.

import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/logger';
import InlineRelatedArticlesView, { type InlineRelatedArticle } from './InlineRelatedArticlesView';

/** Rows consumed by RelatedArticles at the foot of the article. */
const RELATED_FOOTER_COUNT = 3;
const INLINE_COUNT = 3;

export default async function InlineRelatedArticlesServer({
    currentArticleId,
    category,
}: {
    currentArticleId: string;
    category: string;
}) {
    if (!supabase || !category) return null;

    let articles: InlineRelatedArticle[] = [];
    try {
        let q = supabase
            .from('articles')
            .select('id, slug, title, intro')
            .eq('category', category)
            .eq('status', 'approved')
            .order('last_update', { ascending: false })
            .range(RELATED_FOOTER_COUNT, RELATED_FOOTER_COUNT + INLINE_COUNT - 1);
        // Mirrors RelatedArticles: only exclude when there is an id to exclude.
        if (currentArticleId) q = q.neq('id', currentArticleId);
        const { data, error } = await q;
        if (error) {
            logger.error('InlineRelatedArticlesServer query error', error);
            return null;
        }
        // Callers pass the article's slug, while `id` is the primary key, so
        // the .neq above does not always exclude the current article. Drop it
        // here too — an article must never link to itself.
        articles = ((data as InlineRelatedArticle[]) || []).filter(
            (a) => (a.slug || a.id) !== currentArticleId,
        );
    } catch (e) {
        logger.error('InlineRelatedArticlesServer fetch threw', e);
        return null;
    }

    return <InlineRelatedArticlesView articles={articles} />;
}
