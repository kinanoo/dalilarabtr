import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'المصادر الرسمية | دليل العرب في تركيا',
  description: 'روابط مباشرة وآمنة للمواقع الحكومية التركية الرسمية: وزارات، بوابات إلكترونية، وخدمات حكومية موثوقة.',
  alternates: { canonical: '/sources' },
  openGraph: {
    title: 'المصادر الحكومية الرسمية التركية',
    description: 'روابط آمنة ومباشرة للوزارات والبوابات الإلكترونية الحكومية التركية.',
    url: 'https://dalilarabtr.com/sources',
    type: 'website',
  },
};

export default function SourcesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
