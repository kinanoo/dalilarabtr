import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'النماذج الرسمية | دليل العرب في تركيا',
  description: 'تحميل النماذج والاستمارات الرسمية التركية المترجمة للعربية: طلبات إقامة، عمل، وخدمات حكومية.',
  alternates: { canonical: '/forms' },
  openGraph: {
    title: 'النماذج والاستمارات الرسمية التركية بالعربي',
    description: 'حمّل النماذج الرسمية مترجمة: طلبات إقامة، إذن عمل، وخدمات حكومية تركية.',
    url: 'https://dalilarabtr.com/forms',
    type: 'website',
  },
};

export default function FormsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
