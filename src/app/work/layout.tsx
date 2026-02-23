import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'العمل والاستثمار في تركيا | دليل العرب في تركيا',
  description: 'دليل العمل والاستثمار في تركيا: أذونات العمل، إنشاء الشركات، الحقوق العمالية، وفرص الاستثمار.',
  alternates: { canonical: '/work' },
};

export default function WorkLayout({ children }: { children: React.ReactNode }) {
  return children;
}
