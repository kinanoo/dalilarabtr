import RentIncreaseCalculatorClient from './RentIncreaseCalculatorClient';
import ToolSchema from '@/components/ToolSchema';
import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
    title: 'حاسبة زيادة الإيجار القانونية في تركيا 2026 — سقف Kira Artışı حسب TÜFE',
    description: 'احسب الحد الأقصى القانوني لزيادة إيجارك في تركيا 2026 حسب متوسط مؤشر TÜFE لاثني عشر شهراً في شهر التجديد — مع شرح القانون، انتهاء سقف 25%، وحقوق المستأجر.',
    keywords: 'زيادة الإيجار تركيا, سقف زيادة الإيجار 2026, حساب زيادة الإيجار, الحد القانوني لزيادة الإيجار, kira artışı hesaplama, kira zammı oranı 2026, حقوق المستأجر تركيا',
    alternates: { canonical: '/tools/rent-increase-calculator' },
    openGraph: {
        title: 'حاسبة زيادة الإيجار القانونية في تركيا 2026 (Kira Artışı)',
        description: 'اعرف الحد الأقصى القانوني لزيادة إيجارك حسب متوسط TÜFE لاثني عشر شهراً — واحمِ نفسك من الزيادات غير القانونية.',
        url: `${SITE_CONFIG.siteUrl}/tools/rent-increase-calculator`,
        images: ['/og-banner.jpg'],
    },
};

export default function RentIncreaseCalculatorPage() {
    return (
        <>
            <ToolSchema tool="rent-increase-calculator" />
            <RentIncreaseCalculatorClient />
        </>
    );
}
