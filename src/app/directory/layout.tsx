import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
  title: 'الدليل الشامل | دليل العرب في تركيا',
  description: 'دليل شامل بكل المعلومات التي يحتاجها العرب والسوريون في تركيا: إقامات، خدمات، قانون، وحياة يومية.',
  alternates: { canonical: '/directory' },
  openGraph: {
    title: 'الدليل الشامل للعرب في تركيا',
    description: 'كل ما تحتاجه من معلومات عن الإقامة والعمل والخدمات والقانون في تركيا.',
    url: `${SITE_CONFIG.siteUrl}/directory`,
    type: 'website',
  },
};

export default function DirectoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
