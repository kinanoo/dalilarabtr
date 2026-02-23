import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'النماذج الرسمية | دليل العرب في تركيا',
  description: 'تحميل النماذج والاستمارات الرسمية التركية المترجمة للعربية: طلبات إقامة، عمل، وخدمات حكومية.',
  alternates: { canonical: '/forms' },
};

export default function FormsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
