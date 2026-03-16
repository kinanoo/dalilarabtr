import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
  title: 'طلب خدمة | دليل العرب في تركيا',
  description: 'قدّم طلب خدمة جديد: حجز مواعيد، ترجمة، معاملات إقامة، وخدمات قانونية في تركيا.',
  alternates: { canonical: '/request' },
  openGraph: {
    title: 'طلب خدمة — حجز مواعيد، ترجمة، معاملات',
    description: 'قدّم طلب خدمة: حجز مواعيد، ترجمة رسمية، معاملات إقامة، وخدمات قانونية في تركيا.',
    url: `${SITE_CONFIG.siteUrl}/request`,
    type: 'website',
  },
};

export default function RequestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
