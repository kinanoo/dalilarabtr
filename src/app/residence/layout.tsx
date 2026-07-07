import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الإقامة في تركيا',
  description: 'كل ما تحتاجه عن أنواع الإقامة في تركيا: السياحية والدراسية والعائلية والعقارية، مع الأوراق المطلوبة والتكاليف وطرق التقديم والتجديد والتحويل بالتفصيل.',
  alternates: { canonical: '/residence' },
};

export default function ResidenceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
