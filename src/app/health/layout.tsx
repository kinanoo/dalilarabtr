import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الصحة والتأمين في تركيا | دليل العرب في تركيا',
  description: 'دليل الصحة في تركيا: التأمين الصحي، المستشفيات، الأطباء العرب، وكيفية الاستفادة من الخدمات الطبية.',
  alternates: { canonical: '/health' },
};

export default function HealthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
