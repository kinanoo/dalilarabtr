import CurrencyClient from './CurrencyClient';
import ToolSchema from '@/components/ToolSchema';
import RelatedFinanceTools from '@/components/RelatedFinanceTools';
import ToolFooter from '@/components/tools/ToolFooter';
import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
    title: 'سعر الدولار واليورو مقابل الليرة التركية اليوم — محوّل العملات 2026',
    description: 'أسعار صرف الدولار (USD) واليورو (EUR) والريال السعودي والذهب والليرة السورية مقابل الليرة التركية (TRY) اليوم، محدّثة تلقائياً، مع محوّل عملات فوري مجاني.',
    keywords: 'سعر الدولار في تركيا اليوم, سعر صرف الليرة التركية, محول العملات, الدولار مقابل الليرة التركية, سعر اليورو في تركيا, سعر الليرة السورية مقابل التركية, سعر الذهب في تركيا اليوم, dolar kaç tl, euro kaç tl, تحويل الليرة التركية للدولار',
    alternates: { canonical: '/tools/currency' },
    openGraph: {
        title: 'أسعار الصرف اليوم في تركيا — محوّل العملات (دولار · يورو · ذهب · ليرة سورية)',
        description: 'أحدث أسعار الدولار واليورو والريال والذهب والليرة السورية مقابل الليرة التركية، مع محوّل فوري.',
        url: `${SITE_CONFIG.siteUrl}/tools/currency`,
        images: ['/og-banner.jpg'],
        type: 'website',
        locale: 'ar_TR',
        siteName: SITE_CONFIG.name,
    },
};

export default function CurrencyPage() {
    return (
        <>
            <ToolSchema tool="currency-converter" />
            <CurrencyClient />
            <RelatedFinanceTools current="currency" />
            <ToolFooter toolId="currency" />
        </>
    );
}
