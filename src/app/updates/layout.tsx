import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'آخر التحديثات | دليل العرب في تركيا',
  description: 'أهم الأخبار والتحديثات الجديدة المتعلقة بالإقامة والقوانين والخدمات للعرب والسوريين في تركيا.',
  alternates: { canonical: '/updates' },
};

export default function UpdatesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
