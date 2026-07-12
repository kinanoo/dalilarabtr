import PharmacyClient from './PharmacyClient';
import ToolSchema from '@/components/ToolSchema';
import ToolFooter from '@/components/tools/ToolFooter';
import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
    // Intent-matched to the top Search Console queries ("أقرب صيدلية مناوبة من
    // موقعي الآن", "صيدلية مناوبة [مدينة]"): lead with location + now + city
    // coverage so the SERP snippet promises exactly what the searcher wants.
    title: 'أقرب صيدلية مناوبة مفتوحة الآن قربك — كل مدن تركيا 2026 (Nöbetçi Eczane)',
    description: 'اعثر فوراً على أقرب صيدلية مناوبة مفتوحة الآن قرب موقعك في تركيا: اختر مدينتك — إسطنبول، غازي عنتاب، مرسين، أضنة، هاتاي، بورصة، أنطاليا وكل الولايات — عبر خريطة مباشرة + الرابط الرسمي من e-Devlet وأرقام الطوارئ.',
    keywords: 'الصيدلية المناوبة, صيدلية مناوبة, الصيدليات المناوبة, صيدليه مناوبه, أقرب صيدلية مناوبة من موقعي الآن, الصيدلية المناوبة في موقعي, الصيدلية المناوبة اليوم, صيدلية مناوبة اسطنبول, صيدلية مناوبة غازي عنتاب, صيدلية مناوبة مرسين, صيدلية مناوبة أضنة, نوبتشي اجزاني, Nöbetçi Eczane, برنامج الصيدليات المناوبة في تركيا',
    alternates: { canonical: '/tools/pharmacy' },
    openGraph: {
        title: 'أقرب صيدلية مناوبة مفتوحة الآن قربك — كل مدن تركيا',
        description: 'اختر مدينتك واعثر على أقرب صيدلية مناوبة مفتوحة الآن — خريطة مباشرة + الرابط الرسمي من e-Devlet. يغطي كل الولايات التركية الـ 81.',
        url: `${SITE_CONFIG.siteUrl}/tools/pharmacy`,
        images: ['/og-banner.jpg'],
    },
};

export default function PharmacyPage() {
    return (
        <>
            <ToolSchema tool="pharmacy" />
            <PharmacyClient />
            <ToolFooter toolId="pharmacy" />
        </>
    );
}
