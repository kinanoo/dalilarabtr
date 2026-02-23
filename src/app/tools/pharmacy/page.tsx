import PharmacyClient from './PharmacyClient';
import ToolSchema from '@/components/ToolSchema';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'الصيدليات المناوبة في تركيا 2026 | رابط E-Devlet الرسمي',
    description: 'رابط مباشر وفوري لمعرفة الصيدلية المناوبة في منطقتك (إسطنبول، غازي عنتاب، مرسين، وكل المدن) عبر بوابة الحكومة التركية الرسمية E-Devlet.',
    keywords: 'صيدليات مناوبة تركيا, نوبتشي اجزاني, صيدلية مناوبة اسطنبول, صيدلية مناوبة غازي عنتاب, E-Devlet pharmacy, Nöbetçi Eczane',
    alternates: { canonical: '/tools/pharmacy' },
};

export default function PharmacyPage() {
    return (
        <>
            <ToolSchema tool="pharmacy" />
            <PharmacyClient />
        </>
    );
}
