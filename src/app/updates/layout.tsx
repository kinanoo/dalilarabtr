import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
  // The root layout title template appends the brand suffix automatically.
  title: 'أخبار تركيا اليوم — آخر القرارات والتعديلات',
  description:
    'تابع يومياً آخر القرارات والتعديلات والأخبار في تركيا التي تهمّ العرب والسوريين: الإقامات والجنسية، العمل، التعليم، والصحة — أخبار موثّقة بمصادرها الرسمية وتحديث مستمر.',
  alternates: { canonical: '/updates' },
  openGraph: {
    title: 'أخبار تركيا اليوم — آخر القرارات والتعديلات',
    description:
      'آخر القرارات والتعديلات والأخبار في تركيا التي تهمّ العرب والسوريين: إقامات وجنسية، عمل، تعليم، صحة — بمصادر موثّقة.',
    url: `${SITE_CONFIG.siteUrl}/updates`,
    type: 'website',
    images: ['/og-image.jpg'],
  },
};

export default function UpdatesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
