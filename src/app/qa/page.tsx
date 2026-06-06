import type { Metadata } from 'next';
import QAClient from './QAClient';
import { SITE_CONFIG } from '@/lib/config';

/**
 * /qa — public community Q&A page.
 *
 * Server-rendered metadata for SEO; the interactive list + ask form live in
 * QAClient so we can lazy-load the modal and avoid hydrating it on first
 * paint. ISR (10 min) keeps the page fresh enough that newly-answered
 * questions appear quickly without burning Vercel functions per visit.
 */

export const revalidate = 600;

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

export default function QAPage() {
    return <QAClient />;
}
