import KimlikClient from './KimlikClient';
import ToolSchema from '@/components/ToolSchema';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'فاحص الكملك التركي 2026 | التأكد من صلاحية القيد (TC)',
    description: 'أداة مجانية للتحقق من صحة رقم الكملك (TC) وخوارزميته، مع رابط مباشر لبوابة النفوس التركية للتأكد من صلاحية القيد وتفعيله.',
    keywords: 'فحص الكملك, رابط الكملك, التي جي, TC Kimlik, نفوس, دائرة الهجرة, صلاحية الكملك',
    alternates: { canonical: '/tools/kimlik-check' },
};

export default function KimlikCheckPage() {
    return (
        <>
            <ToolSchema tool="kimlik-checker" />
            <KimlikClient />
        </>
    );
}
