import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الدراسة والتعليم في تركيا | دليل العرب في تركيا',
  description: 'دليل الدراسة في تركيا: الجامعات، المدارس، الابتعاث، اعتراف الشهادات، وتأشيرة الطالب.',
  alternates: { canonical: '/education' },
};

export default function EducationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
