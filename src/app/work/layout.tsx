import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'العمل والاستثمار في تركيا',
  description: 'دليل العمل والاستثمار في تركيا للعرب: أذونات العمل وشروطها، إنشاء الشركات، الضرائب والتأمينات الاجتماعية، الحقوق العمالية، وأبرز فرص الاستثمار المتاحة.',
  alternates: { canonical: '/work' },
};

export default function WorkLayout({ children }: { children: React.ReactNode }) {
  return children;
}
