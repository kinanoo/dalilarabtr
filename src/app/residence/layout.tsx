import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الإقامة في تركيا | دليل العرب في تركيا',
  description: 'كل ما تحتاجه عن أنواع الإقامة في تركيا: السياحية، الدراسية، العائلية، والعقارية مع الأوراق والتكاليف.',
  alternates: { canonical: '/residence' },
};

export default function ResidenceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
