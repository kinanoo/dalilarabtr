import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'طلب خدمة | دليل العرب في تركيا',
  description: 'قدّم طلب خدمة جديد عبر واتساب: حجز مواعيد، ترجمة، معاملات إقامة، وخدمات قانونية في تركيا.',
  alternates: { canonical: '/request' },
};

export default function RequestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
