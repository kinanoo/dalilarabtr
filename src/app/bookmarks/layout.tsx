import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
  title: `المفضلة — ${SITE_CONFIG.name}`,
  description: 'المقالات والمحتوى المحفوظ في قائمة المفضلة الخاصة بك.',
  alternates: {
    canonical: `${SITE_CONFIG.siteUrl}/bookmarks`,
  },
  openGraph: {
    title: `المفضلة — ${SITE_CONFIG.name}`,
    description: 'المقالات والمحتوى المحفوظ في قائمة المفضلة الخاصة بك.',
    url: `${SITE_CONFIG.siteUrl}/bookmarks`,
    type: 'website',
  },
};

export default function BookmarksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
