/**
 * FeaturedNewsHero — the homepage's "show this above everything" slot.
 *
 * Server component: queries Supabase for ALL active+approved articles
 * tagged خبر_رئيسي (newest first, cap at 10), then hands the array to
 * the FeaturedNewsCarousel client component which auto-rotates between
 * them (5s display + 2s gold shimmer per transition).
 *
 * If exactly 1 article matches, the carousel still renders but with
 * rotation disabled (no dots, no timer) — visually identical to the
 * previous single-article version.
 *
 * Renders nothing when no tagged article exists — silent fallback.
 */

import { supabase, withTimeout } from '@/lib/supabaseClient';
import FeaturedNewsCarousel, { type CarouselArticle } from './FeaturedNewsCarousel';

const FEATURED_TAG = 'خبر_رئيسي';

async function getFeaturedArticles(): Promise<CarouselArticle[]> {
    if (!supabase) return [];
    try {
        const result = await withTimeout(
            supabase
                .from('articles')
                .select('slug, title, intro, category, published_at, image')
                .contains('tags', [FEATURED_TAG])
                .eq('active', true)
                .eq('status', 'approved')
                .order('published_at', { ascending: false })
                // Tiebreaker for same-day publishes — most recently
                // saved article wins. Without this, three articles all
                // dated "2026-06-09" would fall back to Postgres's
                // natural insertion order, which doesn't match the
                // admin's mental model of "I just published X, why is
                // it not first?"
                .order('updated_at', { ascending: false })
                // Cap at 10 — if the admin keeps stacking featured
                // articles without un-featuring old ones, we don't want
                // the carousel to take a literal minute to cycle through.
                .limit(10),
            5000,
        );
        const rows = (result as { data?: CarouselArticle[] } | null)?.data;
        return rows || [];
    } catch {
        return [];
    }
}

export default async function FeaturedNewsHero() {
    const articles = await getFeaturedArticles();
    if (articles.length === 0) return null;

    // Hand off to the client carousel. Server-rendered HTML still
    // contains the first article (the client renders index 0 first),
    // so crawlers + social-share previews work as before.
    return <FeaturedNewsCarousel articles={articles} />;
}
