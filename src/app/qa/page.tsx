import type { Metadata } from 'next';
import QAClient from './QAClient';
import { SITE_CONFIG } from '@/lib/config';
import { supabase, withTimeout } from '@/lib/supabaseClient';
import logger from '@/lib/logger';

/**
 * /qa — public community Q&A page.
 *
 * Server-rendered metadata for SEO; the interactive list + ask form live in
 * QAClient so we can lazy-load the modal and avoid hydrating it on first
 * paint. ISR (10 min) keeps the page fresh enough that newly-answered
 * questions appear quickly without burning Vercel functions per visit.
 *
 * The answered/featured questions are fetched here on the server and passed to
 * QAClient as initial props, so crawlers and first paint see the full Q&A
 * content (SEO) instead of a spinner. QAClient keeps the client search box and
 * still owns the ask-modal / interactivity.
 */

export const revalidate = 600;

interface QARow {
    id: string;
    question: string;
    context: string | null;
    category: string | null;
    asker_name: string | null;
    answer: string;
    answered_at: string;
    upvotes: number;
    views: number;
    is_featured: boolean;
}

/** Fetch answered questions server-side, mirroring GET /api/questions?featured=1. */
async function getInitialQuestions(): Promise<{ items: QARow[]; total: number }> {
    if (!supabase) return { items: [], total: 0 };
    try {
        const res = await withTimeout(
            supabase
                .from('questions')
                .select(
                    'id, question, context, category, asker_name, answer, answered_at, upvotes, views, is_featured',
                    { count: 'exact' }
                )
                .eq('status', 'answered')
                .order('is_featured', { ascending: false })
                .range(0, 49)
        );
        if (!res || res.error) {
            if (res?.error) logger.error('qa initial fetch:', res.error);
            return { items: [], total: 0 };
        }
        return { items: (res.data as QARow[]) || [], total: res.count ?? 0 };
    } catch (err) {
        logger.error('qa initial fetch unhandled:', err);
        return { items: [], total: 0 };
    }
}

export const metadata: Metadata = {
    title: 'الأسئلة والأجوبة | اسأل واحصل على إجابة موثّقة',
    description:
        'منصّة أسئلة وأجوبة للسوريين والعرب في تركيا. اطرح سؤالك وستحصل على إجابة موثّقة من فريقنا. تصفّح آلاف الأسئلة المُجابة عن الإقامة، العمل، الصحّة، التعليم، والقانون.',
    alternates: { canonical: `${SITE_CONFIG.siteUrl}/qa` },
    openGraph: {
        type: 'website',
        title: 'اسأل واحصل على إجابة موثّقة — دليل العرب والسوريين في تركيا',
        description: 'آلاف الأسئلة المُجابة + اطرح سؤالك الآن.',
        url: `${SITE_CONFIG.siteUrl}/qa`,
    },
};

export default async function QAPage() {
    const { items, total } = await getInitialQuestions();

    // FAQPage structured data — surfaces the answered questions as Google rich
    // results, which is the single biggest organic-discovery lever for Q&A
    // (people search their exact question). Answers here are authoritative
    // (written by the site team), so FAQPage is the correct type. Cap + trim to
    // keep the payload sane.
    const faqEntities = items.slice(0, 30).map((q) => ({
        '@type': 'Question',
        name: q.question,
        acceptedAnswer: {
            '@type': 'Answer',
            text: (q.answer || '').replace(/\s+/g, ' ').trim().slice(0, 1200),
        },
    }));

    const jsonLd = faqEntities.length > 0
        ? {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            '@id': `${SITE_CONFIG.siteUrl}/qa`,
            name: 'الأسئلة والأجوبة — دليل العرب والسوريين في تركيا',
            inLanguage: 'ar',
            mainEntity: faqEntities,
        }
        : null;

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <QAClient initialItems={items} initialTotal={total} />
        </>
    );
}
