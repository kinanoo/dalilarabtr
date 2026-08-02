'use client';

import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabaseLazy';
import InlineRelatedArticlesView, { type InlineRelatedArticle } from './InlineRelatedArticlesView';

/**
 * Client variant — for client trees that cannot import a server component
 * (the calculator, kimlik-check and ban-calculator pages).
 *
 * Article pages use InlineRelatedArticlesServer instead: there the links have
 * to be in the server HTML, and a useEffect fetch contributes nothing to it.
 */
export default function InlineRelatedArticles({ currentArticleId, category }: { currentArticleId: string; category: string }) {
    const [articles, setArticles] = useState<InlineRelatedArticle[]>([]);

    useEffect(() => {
        async function fetch() {
            if (!category) return;
            // Lazy client — keeps supabase-js out of the article first load.
            const supabase = await getSupabase();
            if (!supabase) return;
            const { data } = await supabase
                .from('articles')
                .select('id, slug, title, intro')
                .eq('category', category)
                .eq('status', 'approved')
                .neq('id', currentArticleId)
                .limit(3);

            if (data && data.length > 0) setArticles(data as InlineRelatedArticle[]);
        }
        fetch();
    }, [category, currentArticleId]);

    return <InlineRelatedArticlesView articles={articles} />;
}
