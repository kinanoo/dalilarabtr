import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'آخر التحديثات | دليل العرب في تركيا',
  description: 'أهم الأخبار والتحديثات الجديدة المتعلقة بالإقامة والقوانين والخدمات للعرب والسوريين في تركيا.',
  alternates: { canonical: '/updates' },
  openGraph: {
    title: 'آخر الأخبار والتحديثات للعرب في تركيا',
    description: 'أحدث الأخبار والتغييرات المتعلقة بالإقامات والقوانين والخدمات في تركيا.',
    url: 'https://dalilarabtr.com/updates',
    type: 'website',
  },
};

export default function UpdatesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
