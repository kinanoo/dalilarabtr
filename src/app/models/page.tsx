import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import ModelsGalleryClient from '@/components/models/ModelsGalleryClient';
import ModelsGalleryGate from '@/components/models/ModelsGalleryGate';
import { MODELS_GALLERY_COOKIE, verifyModelsGallerySession } from '@/lib/models/gallery-auth';
import { getModelsGalleryPasswordConfig } from '@/lib/models/gallery-password';
import { getPublicModelsGallery } from '@/lib/models/server';
import { SITE_CONFIG } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'معرض النماذج',
  description: 'معرض دائم لنماذج مختارة من الأعمال والخدمات.',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  alternates: { canonical: `${SITE_CONFIG.siteUrl}/models` },
  openGraph: {
    title: 'معرض النماذج',
    description: 'استعرض نماذج مختارة من الأعمال والخدمات.',
    url: `${SITE_CONFIG.siteUrl}/models`,
    type: 'website',
    images: [{ url: `${SITE_CONFIG.siteUrl}/og-banner.jpg`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'معرض النماذج',
    description: 'استعرض نماذج مختارة من الأعمال والخدمات.',
    images: [`${SITE_CONFIG.siteUrl}/og-banner.jpg`],
  },
};

export default async function ModelsIndexPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(MODELS_GALLERY_COOKIE)?.value;
  const passwordConfig = await getModelsGalleryPasswordConfig();
  if (!passwordConfig || !verifyModelsGallerySession(session, passwordConfig.passwordVersion)) {
    return <ModelsGalleryGate />;
  }

  const collections = await getPublicModelsGallery();
  return <ModelsGalleryClient collections={collections} />;
}
