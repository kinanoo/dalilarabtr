import PharmacyClient from './PharmacyClient';
import ToolSchema, { getToolFaqs } from '@/components/ToolSchema';
import ToolFooter from '@/components/tools/ToolFooter';
import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
    // Intent-matched to the top Search Console queries ("أقرب صيدلية مناوبة من
    // موقعي الآن", "صيدلية مناوبة [مدينة]") WITHOUT over-promising. We do not
    // hold the daily duty roster — it is per-district, changes daily, and no
    // source we may lawfully redistribute covers all 81 provinces. The old
    // title promised "أقرب صيدلية مفتوحة الآن قربك" and the page then handed
    // the visitor to Google Maps, which is why it sat at position 7.3 with a
    // 1.5% CTR while /zones (which answers on-page) sits at 4.3 / 21.5%.
    // So: keep the query terms, promise the route to the official list, and
    // deliver what only we can — the Turkish phrases and the timing warning.
    title: 'الصيدلية المناوبة في تركيا 2026: كيف تجد أقربها الآن (Nöbetçi Eczane)',
    description: 'أسرع طريقتين رسميتين للوصول إلى الصيدلية المناوبة القريبة منك في تركيا: القائمة الرسمية من وزارة الصحة بالأسماء والعناوين وأرقام الهواتف، وخريطة مباشرة — مع تنبيه أوقات المناوبة، والعبارات التركية التي تحتاجها عند الصيدلية، وأرقام الطوارئ. يغطي كل الولايات.',
    keywords: 'الصيدلية المناوبة, صيدلية مناوبة, الصيدليات المناوبة, صيدليه مناوبه, أقرب صيدلية مناوبة من موقعي الآن, الصيدلية المناوبة في موقعي, الصيدلية المناوبة اليوم, صيدلية مناوبة اسطنبول, صيدلية مناوبة غازي عنتاب, صيدلية مناوبة مرسين, صيدلية مناوبة أضنة, نوبتشي اجزاني, Nöbetçi Eczane, برنامج الصيدليات المناوبة في تركيا',
    alternates: { canonical: '/tools/pharmacy' },
    openGraph: {
        title: 'الصيدلية المناوبة في تركيا: كيف تجد أقربها الآن',
        description: 'القائمة الرسمية من وزارة الصحة بالأسماء والعناوين والهواتف، وخريطة قريبة منك، وتنبيه أوقات المناوبة، والعبارات التركية عند الصيدلية.',
        url: `${SITE_CONFIG.siteUrl}/tools/pharmacy`,
        images: ['/og-banner.jpg'],
    },
};

export default function PharmacyPage() {
    return (
        <>
            <ToolSchema tool="pharmacy" />
            {/* One FAQ source for both the JSON-LD above and the visible section
                inside the client — see the note on TOOLS_DATA['pharmacy']. */}
            <PharmacyClient faqs={getToolFaqs('pharmacy')} />
            <ToolFooter toolId="pharmacy" />
        </>
    );
}
