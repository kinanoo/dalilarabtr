'use client';

import { usePathname } from 'next/navigation';

/**
 * SiteBackdrop — a faint, fixed Istanbul photo behind ALL page content.
 *
 * Purely decorative: aria-hidden, pointer-events:none, and it sits ABOVE the
 * opaque body background but BELOW the z-10 content wrapper, so nothing about
 * the existing design/layout/text changes — the photo only shows through the
 * page's light gaps (hero, margins, between sections) at a whisper of opacity.
 *
 * Settings match the preview the owner approved: image 8% · white veil 25% ·
 * green wash 55% (see globals.css .site-backdrop). Four images rotate by the
 * top-level route so different sections feel varied but each page is stable.
 * Hidden on /admin to keep the dashboard clean.
 */

const IMAGES = ['/bg/bg-1.webp', '/bg/bg-2.webp', '/bg/bg-3.webp', '/bg/bg-4.webp'];

function pickIndex(pathname: string): number {
  if (pathname === '/' || pathname === '') return 0; // the landscape image on the homepage
  const seg = pathname.split('/')[1] || 'home';
  let h = 0;
  for (let i = 0; i < seg.length; i++) h = (h * 31 + seg.charCodeAt(i)) >>> 0;
  return h % IMAGES.length;
}

export default function SiteBackdrop() {
  const pathname = usePathname() || '/';
  if (pathname.startsWith('/admin')) return null;

  const img = IMAGES[pickIndex(pathname)];
  return (
    <div className="site-backdrop" aria-hidden="true">
      <div className="sb-img" style={{ backgroundImage: `url(${img})` }} />
      <div className="sb-tint" />
      <div className="sb-veil" />
    </div>
  );
}
