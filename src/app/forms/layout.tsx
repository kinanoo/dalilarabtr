import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
  title: 'النماذج الرسمية',
  description: 'تحميل النماذج والاستمارات الرسمية التركية المترجمة للعربية: طلبات إقامة، عمل، وخدمات حكومية.',
  alternates: { canonical: '/forms' },
  openGraph: {
    title: 'النماذج والاستمارات الرسمية التركية بالعربي',
    description: 'حمّل النماذج الرسمية مترجمة: طلبات إقامة، إذن عمل، وخدمات حكومية تركية.',
    url: `${SITE_CONFIG.siteUrl}/forms`,
    type: 'website',
    images: ['/og-banner.jpg'],
  },
};

export default function FormsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
