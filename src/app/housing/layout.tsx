import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'السكن في تركيا',
  description: 'دليل السكن للعرب في تركيا: كيفية استئجار الشقق ومقارنة الأسعار، عقود الإيجار وشروطها، حقوق المستأجر، فواتير الخدمات، وتجنب الاحتيال العقاري خطوة بخطوة.',
  alternates: { canonical: '/housing' },
};

export default function HousingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
