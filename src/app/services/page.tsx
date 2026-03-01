import ServicesClient from './ServicesClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'دليل الخدمات في تركيا | أطباء، محامون، ومترجمون',
    description: 'ابحث عن أفضل مقدمي الخدمات العرب في تركيا — إسطنبول، غازي عنتاب، أنقرة، بورصة. أطباء، محامون، مترجمون، عقارات، تأمين وأكثر.',
    alternates: { canonical: '/services' },
};

export default function ServicesPage() {
    return <ServicesClient />;
}
