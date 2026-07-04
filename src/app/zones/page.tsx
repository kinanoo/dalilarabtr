import ZonesClient from './ZonesClient';
import ToolSchema from '@/components/ToolSchema';
import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/config';
import { supabase } from '@/lib/supabaseClient';
import UniversalComments from '@/components/community/UniversalComments';
import RelatedArticles from '@/components/RelatedArticles';
import logger from '@/lib/logger';

export const metadata: Metadata = {
    title: 'فاحص المناطق المحظورة للسوريين 2026 | قائمة الأحياء المغلقة',
    description: 'أداة رسمية للتحقق من الأحياء والمناطق المحظورة لتثبيت النفوس للسوريين (الكملك) والأجانب في تركيا. ابحث عن منطقتك الآن.',
    keywords: 'المناطق المحظورة, تثبيت النفوس, كملك, سوريين تركيا, احياء مغلقة, نفوس اسطنبول, المناطق المحظورة للسوريين, المناطق المحظورة في قونيا',
    alternates: { canonical: '/zones' },
    openGraph: {
        title: 'فاحص المناطق المحظورة للأجانب في تركيا 2026',
        description: 'تحقق فوراً إذا كان الحي مفتوح أو مغلق لتسجيل النفوس. يغطي كل الولايات التركية.',
        url: `${SITE_CONFIG.siteUrl}/zones`,
        type: 'website',
        images: ['/og-image.jpg'],
    },
};

// Re-fetch the zones snapshot at most every 10 minutes on the SERVER (ISR),
// so the whole list is baked into the cached HTML once per window instead of
// every visitor's browser re-downloading ~1,166 rows from Supabase. That was
// the site's single biggest source of Supabase egress. ZonesClient keeps its
// own client fetch as a fallback (used only if this server fetch fails).
export const revalidate = 600;

type RawZone = { city: string; district: string; neighborhood: string; status: string; updated_at: string; reopened_at: string | null };

async function getZonesPayload() {
    if (!supabase) return null;
    try {
        const allRows: RawZone[] = [];
        let from = 0;
        const step = 1000;
        let more = true;
        while (more) {
            const { data: rows, error } = await supabase
                .from('zones')
                .select('city, district, neighborhood, status, updated_at, reopened_at')
                .in('status', ['closed', 'reopened', 'pending'])
                .range(from, from + step - 1);
            if (error) throw error;
            if (rows && rows.length > 0) {
                allRows.push(...(rows as RawZone[]));
                if (rows.length < step) more = false;
                else from += step;
            } else {
                more = false;
            }
        }
        if (allRows.length === 0) return null;

        const items = allRows.map((r) => ({
            c: r.city,
            d: r.district,
            n: r.neighborhood,
            s: (r.status === 'reopened' ? 'reopened' : r.status === 'pending' ? 'pending' : 'closed') as 'reopened' | 'pending' | 'closed',
            r: r.reopened_at || null,
        }));
        const updatedAt = new Date(Math.max(...allRows.map((r) => new Date(r.updated_at).getTime()))).toISOString().split('T')[0];
        return { updatedAt, source: 'Admin Panel (Live DB)', items };
    } catch (err) {
        // Never break the page on a fetch hiccup — ZonesClient will fetch itself.
        logger.error('zones SSR fetch failed:', err);
        return null;
    }
}

export default async function ZonesPage() {
    const initialData = await getZonesPayload();
    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
            <ToolSchema tool="restricted-areas" />
            <ZonesClient initialData={initialData} />

            <div className="max-w-4xl mx-auto px-4 mt-12 space-y-8">
                <UniversalComments entityType="zone" entityId="main-map" />
                <RelatedArticles currentArticleId="" category="السكن والحياة" />
            </div>
        </main>
    );
}
