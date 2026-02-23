import ServicesClient from './ServicesClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'دليل الخدمات في تركيا | أطباء، محامون، ومترجمون',
    description: 'ابحث عن أفضل مقدمي الخدمات العرب في تركيا. أطباء، محامون، مترجمون محلفون، وخدمات عقارية موثوقة.',
    alternates: { canonical: '/services' },
};

export default function ServicesPage() {
    return <ServicesClient />;
}
