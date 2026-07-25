import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/config';
import CodesIndex from './CodesIndex';

// The Turkish edition lives at /codes/tr as a REAL path, not ?lang=tr.
// Reading searchParams forced this route to render dynamically — verified live,
// it answered `Cache-Control: private, no-cache, no-store`, so the declared
// revalidate never engaged and every visit re-queried the codes table. A path
// also gives each language its own cacheable URL, which is what hreflang is
// supposed to point at.
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'كاشف ومحلل الأكواد الأمنية في تركيا (V-87، G-87، Ç...)',
    description: 'افهم كل أكواد المنع والحظر الأمنية التركية وأسباب وضعها وكيفية إزالتها — كاشف شامل قابل للبحث بالكود أو بالوصف.',
    alternates: { canonical: '/codes', languages: { ar: '/codes', tr: '/codes/tr' } },
    openGraph: {
      title: 'كاشف ومحلل الأكواد الأمنية في تركيا (V-87، G-87)',
      description: 'افهم كل أكواد المنع والحظر الأمنية التركية وأسباب وضعها وكيفية إزالتها.',
      url: `${SITE_CONFIG.siteUrl}/codes`,
      type: 'website',
      images: ['/og-banner.jpg'],
    },
  };
}

export default async function CodesPage() {
  return <CodesIndex lang="ar" />;
}
