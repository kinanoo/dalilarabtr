import SeveranceCalculatorClient from './SeveranceCalculatorClient';
import ToolSchema from '@/components/ToolSchema';
import RelatedFinanceTools from '@/components/RelatedFinanceTools';
import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
    title: 'حاسبة تعويض نهاية الخدمة في تركيا 2026 — Kıdem و İhbar Tazminatı',
    description: 'احسب تعويض نهاية الخدمة (Kıdem) وتعويض الإشعار (İhbar) في تركيا 2026 حسب راتبك ومدة عملك، مع شروط الاستحقاق وسقف التعويض الرسمي 73,729.87 ل.ت.',
    keywords: 'تعويض نهاية الخدمة تركيا, حساب تعويض نهاية الخدمة, تعويض الفصل من العمل تركيا, تعويض الإشعار, kıdem tazminatı hesaplama, ihbar tazminatı 2026, سقف تعويض نهاية الخدمة 2026, حقوق العامل عند الفصل',
    alternates: { canonical: '/tools/severance-calculator' },
    openGraph: {
        title: 'حاسبة تعويض نهاية الخدمة في تركيا 2026 (Kıdem و İhbar)',
        description: 'احسب حقوقك عند إنهاء العمل: تعويض نهاية الخدمة وتعويض الإشعار حسب راتبك ومدة خدمتك، بأرقام 2026 الرسمية.',
        url: `${SITE_CONFIG.siteUrl}/tools/severance-calculator`,
        images: ['/og-banner.jpg'],
    },
};

export default function SeveranceCalculatorPage() {
    return (
        <>
            <ToolSchema tool="severance-calculator" />
            <SeveranceCalculatorClient />
            <RelatedFinanceTools current="severance" />
        </>
    );
}
