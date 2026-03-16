import ServicesClient from './ServicesClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'دليل الخدمات في تركيا | أطباء، محامون، ومترجمون',
    description: 'ابحث عن أفضل مقدمي الخدمات العرب في تركيا — إسطنبول، غازي عنتاب، أنقرة، بورصة. أطباء، محامون، مترجمون، عقارات، تأمين وأكثر.',
    alternates: { canonical: '/services' },
    openGraph: {
        title: 'دليل الخدمات العربية في تركيا',
        description: 'أطباء، محامون، مترجمون، وعقارات — ابحث عن مقدمي خدمات عرب موثوقين في كل مدن تركيا.',
        url: 'https://dalilarabtr.com/services',
        type: 'website',
    },
};

export default function ServicesPage() {
    return <ServicesClient />;
}
