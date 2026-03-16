import PharmacyClient from './PharmacyClient';
import ToolSchema from '@/components/ToolSchema';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'الصيدلية المناوبة الآن 2026 | أقرب صيدلية مفتوحة في تركيا',
    description: 'اعرف أقرب صيدلية مناوبة مفتوحة الآن في إسطنبول، غازي عنتاب، مرسين، أنطاليا وكل مدن تركيا — رابط رسمي مباشر من e-Devlet + أرقام الطوارئ.',
    keywords: 'الصيدلية المناوبة, صيدلية مناوبة, الصيدليات المناوبة, صيدليه مناوبه, الصيدلية المناوبة في موقعي, الصيدلية المناوبة اليوم, صيدلية مناوبة اسطنبول, نوبتشي اجزاني, Nöbetçi Eczane, برنامج الصيدليات المناوبة في تركيا',
    alternates: { canonical: '/tools/pharmacy' },
    openGraph: {
        title: 'الصيدلية المناوبة الآن — اعرف أقرب صيدلية مفتوحة',
        description: 'رابط رسمي مباشر لمعرفة الصيدلية المناوبة في منطقتك الآن. يغطي كل الولايات التركية الـ 81.',
        url: 'https://dalilarabtr.com/tools/pharmacy',
    },
};

export default function PharmacyPage() {
    return (
        <>
            <ToolSchema tool="pharmacy" />
            <PharmacyClient />
        </>
    );
}
