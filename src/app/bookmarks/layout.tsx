import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
  title: `المفضلة — ${SITE_CONFIG.name}`,
  description: 'المقالات والمحتوى المحفوظ في قائمة المفضلة الخاصة بك.',
  // Per-user personalized list — must never be indexed. Matches the discipline
  // used on /dashboard. robots.txt already disallows /bookmarks too, but the
  // metadata-level noindex is defense-in-depth in case Google reaches the
  // page through another channel (referer leak, sitemap mistake, etc.).
  robots: { index: false, follow: false, noarchive: true },
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
