import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الدراسة والتعليم في تركيا',
  description: 'دليل الدراسة في تركيا للطلاب العرب: الجامعات الحكومية والخاصة، المدارس، المنح والابتعاث، معادلة واعتراف الشهادات، وشروط تأشيرة الطالب خطوة بخطوة.',
  alternates: { canonical: '/education' },
};

export default function EducationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
