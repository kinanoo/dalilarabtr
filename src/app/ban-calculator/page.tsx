import BanCalculatorClient from './BanCalculatorClient';
import ToolSchema from '@/components/ToolSchema';
import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
    title: 'حاسبة مدة المنع من تركيا 2026 | أكواد الترحيل (V-87, Ç-114)',
    description: 'حاسبة قانونية دقيقة لحساب مدة المنع من دخول تركيا بناءً على مدة المخالفة ونوع الخروج (طوعي أو ترحيل) ودفع الغرامة. اعرف كود المنع المتوقع.',
    keywords: 'حاسبة المنع, منع الدخول تركيا, كود V-87, كود G-87, ترحيل من تركيا, مخالفة الإقامة, غرامة المطار',
    alternates: { canonical: '/ban-calculator' },
    openGraph: {
        title: 'حاسبة مدة المنع من تركيا 2026 | دليل العرب في تركيا',
        description: 'حاسبة قانونية دقيقة لحساب مدة المنع من دخول تركيا بناءً على مدة المخالفة ونوع الخروج.',
        url: `${SITE_CONFIG.siteUrl}/ban-calculator`,
        type: 'website',
        images: [{ url: `${SITE_CONFIG.siteUrl}/og-image.jpg`, width: 1200, height: 630 }],
    },
};

export default function BanCalculatorPage() {
    return (
        <>
            <ToolSchema tool="ban-calculator" />
            <BanCalculatorClient />
        </>
    );
}
