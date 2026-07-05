import ResidenceCalculatorClient from './ResidenceCalculatorClient';
import ToolSchema from '@/components/ToolSchema';
import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
    title: 'حاسبة أيام الإقامة والغياب عن تركيا 2026 — احسب مدة غيابك للجنسية',
    description: 'حاسبة مجانية لعدّ أيام غيابك عن تركيا وأطول فترة غياب — لمتابعة شرط الإقامة المتّصلة عند التقديم على الجنسية أو الإقامة طويلة الأمد. أدخل تواريخ سفرك واحصل على المجموع فوراً.',
    keywords: 'حساب مدة الإقامة في تركيا, أيام الغياب عن تركيا, مدة الغياب المسموحة للجنسية التركية, الإقامة المتصلة تركيا, حاسبة الإقامة طويلة الأمد, كم يوم غياب مسموح تركيا, الإقامة الدائمة تركيا شروط',
    alternates: { canonical: '/tools/residence-calculator' },
    openGraph: {
        title: 'حاسبة أيام الإقامة والغياب عن تركيا',
        description: 'عدّ أيام غيابك عن تركيا وتابع شرط الإقامة المتّصلة للجنسية أو الإقامة طويلة الأمد.',
        url: `${SITE_CONFIG.siteUrl}/tools/residence-calculator`,
        images: ['/og-image.jpg'],
    },
};

export default function ResidenceCalculatorPage() {
    return (
        <>
            <ToolSchema tool="residence-calculator" />
            <ResidenceCalculatorClient />
        </>
    );
}
