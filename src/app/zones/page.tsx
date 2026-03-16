import ZonesClient from './ZonesClient';
import ToolSchema from '@/components/ToolSchema';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'فاحص المناطق المحظورة للسوريين 2026 | قائمة الأحياء المغلقة',
    description: 'أداة رسمية للتحقق من الأحياء والمناطق المحظورة لتثبيت النفوس للسوريين (الكملك) والأجانب في تركيا. ابحث عن منطقتك الآن.',
    keywords: 'المناطق المحظورة, تثبيت النفوس, كملك, سوريين تركيا, احياء مغلقة, نفوس اسطنبول, المناطق المحظورة للسوريين, المناطق المحظورة في قونيا',
    alternates: { canonical: '/zones' },
    openGraph: {
        title: 'فاحص المناطق المحظورة للأجانب في تركيا 2026',
        description: 'تحقق فوراً إذا كان الحي مفتوح أو مغلق لتسجيل النفوس. يغطي كل الولايات التركية.',
        url: 'https://dalilarabtr.com/zones',
        type: 'website',
    },
};

import UniversalComments from '@/components/community/UniversalComments';

import RelatedArticles from '@/components/RelatedArticles';

export default function ZonesPage() {
    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
            <ToolSchema tool="restricted-areas" />
            <ZonesClient />

            <div className="max-w-4xl mx-auto px-4 mt-12 space-y-8">
                <UniversalComments entityType="zone" entityId="main-map" />
                <RelatedArticles currentArticleId="" category="السكن والحياة" />
            </div>
        </main>
    );
}
