import ZonesClient from './ZonesClient';
import ToolSchema from '@/components/ToolSchema';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'فاحص المناطق المحظورة للسوريين 2025 | قائمة الأحياء المغلقة',
    description: 'أداة رسمية للتحقق من الأحياء والمناطق المحظورة لتثبيت النفوس للسوريين (الكملك) والأجانب في تركيا. ابحث عن منطقتك الآن.',
    keywords: 'المناطق المحظورة, تثبيت النفوس, كملك, سوريين تركيا, احياء مغلقة, نفوس اسطنبول, المناطق المحظورة للسوريين',
};

export default function ZonesPage() {
    return (
        <>
            <ToolSchema tool="restricted-areas" />
            <ZonesClient />
        </>
    );
}
