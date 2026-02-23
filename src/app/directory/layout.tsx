import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الدليل الشامل | دليل العرب في تركيا',
  description: 'دليل شامل بكل المعلومات التي يحتاجها العرب والسوريون في تركيا: إقامات، خدمات، قانون، وحياة يومية.',
  alternates: { canonical: '/directory' },
};

export default function DirectoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
