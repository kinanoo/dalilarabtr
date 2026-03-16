import KimlikClient from './KimlikClient';
import ToolSchema from '@/components/ToolSchema';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'فحص الكملك التركي 2026 | هل الكملك شغال؟ تأكد فوراً مجاناً',
    description: 'تأكد من صلاحية الكملك (TC Kimlik) فوراً — فحص خوارزمي مجاني + رابط مباشر لموقع النفوس التركي الرسمي NVI. اكتشف إذا كان قيدك فعّال أو مُبطل خلال ثوانٍ.',
    keywords: 'فحص الكملك, التاكد من صلاحية الكملك, هل الكملك شغال, رابط فحص الكملك 99, التحقق من الكملك, فحص قيد الكملك, صلاحية الكملك, كيف اعرف الكملك شغال, رابط التحقق من قيد الكملك, TC Kimlik doğrulama',
    alternates: { canonical: '/tools/kimlik-check' },
    openGraph: {
        title: 'فحص الكملك التركي — تأكد من صلاحية قيدك فوراً',
        description: 'أداة مجانية للتحقق من رقم الكملك + رابط مباشر لموقع النفوس الرسمي. اعرف إذا الكملك شغال أو موقوف.',
        url: 'https://dalilarabtr.com/tools/kimlik-check',
    },
};

export default function KimlikCheckPage() {
    return (
        <>
            <ToolSchema tool="kimlik-checker" />
            <KimlikClient />
        </>
    );
}
