import SalaryCalculatorClient from './SalaryCalculatorClient';
import ToolSchema from '@/components/ToolSchema';
import RelatedFinanceTools from '@/components/RelatedFinanceTools';
import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
    // Intent-matched to the top queries ("net maaş hesaplama", "حساب الراتب
    // الصافي تركيا"): lead with net⇄gross + 2026 + the deductions promise.
    title: 'حاسبة الراتب الصافي والإجمالي في تركيا 2026 — تحويل Net ⇄ Brüt مع الاقتطاعات',
    description: 'حاسبة مجانية لتحويل الراتب من الإجمالي (Brüt) إلى الصافي (Net) في تركيا 2026 مع تفصيل اقتطاعات الضمان (SGK)، البطالة، ضريبة الدخل، وضريبة الطابع.',
    keywords: 'حاسبة الراتب في تركيا, الراتب الصافي تركيا 2026, تحويل بروت نت, حساب الراتب الصافي من الاجمالي, net maaş hesaplama, brüt net maaş hesaplama 2026, كم صافي الراتب في تركيا, اقتطاعات SGK, الحد الأدنى للأجور تركيا 2026, صافي الحد الادنى تركيا',
    alternates: { canonical: '/tools/salary-calculator' },
    openGraph: {
        title: 'حاسبة الراتب الصافي والإجمالي في تركيا 2026 (Net ⇄ Brüt)',
        description: 'حوّل راتبك بين الإجمالي والصافي مع تفصيل كل الاقتطاعات الرسمية لعام 2026 — الضمان، البطالة، ضريبة الدخل، وضريبة الطابع.',
        url: `${SITE_CONFIG.siteUrl}/tools/salary-calculator`,
        images: ['/og-banner.jpg'],
        type: 'website',
        locale: 'ar_TR',
        siteName: SITE_CONFIG.name,
    },
};

export default function SalaryCalculatorPage() {
    return (
        <>
            <ToolSchema tool="salary-calculator" />
            <SalaryCalculatorClient />
            <RelatedFinanceTools current="salary" />
        </>
    );
}
