import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'السكن في تركيا | دليل العرب في تركيا',
  description: 'دليل السكن للعرب في تركيا: كيفية استئجار الشقق، عقود الإيجار، حقوق المستأجر، وتجنب الاحتيال العقاري.',
  alternates: { canonical: '/housing' },
};

export default function HousingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
