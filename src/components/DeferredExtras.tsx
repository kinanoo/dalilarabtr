'use client';

import { lazy, Suspense, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Toaster } from 'sonner';
import { isPrivateModelSharePath } from '@/lib/models/routes';

const AmbientBackground = lazy(() => import('@/components/ui/AmbientBackground'));
// SiteBackdrop is pure decoration but imports the full supabase-js client
// (~63KB gz) for its DB-driven config. Statically imported from the layout it
// dragged supabase into the CRITICAL path of every page; lazy-loading it here
// keeps the visual while moving that cost after hydration.
const SiteBackdrop = lazy(() => import('@/components/SiteBackdrop'));
const ConsentAwareAnalytics = lazy(() => import('@/components/ConsentAwareAnalytics'));
const NotificationManager = lazy(() => import('@/components/NotificationManager'));
const CopyProtection = lazy(() => import('@/components/ui/CopyProtection'));
const ServiceWorkerRegister = lazy(() => import('@/components/pwa/ServiceWorkerRegister'));
const PWAInstallPrompt = lazy(() => import('@/components/PWAInstallPrompt'));
const WhatsAppAssistant = lazy(() => import('@/components/WhatsAppAssistant'));
const BackToTop = lazy(() => import('@/components/BackToTop'));
const CookieConsent = lazy(() => import('@/components/CookieConsent'));
const BodyImageGallery = lazy(() => import('@/components/article/BodyImageGallery'));
const ProseContrastGuard = lazy(() => import('@/components/article/ProseContrastGuard'));

export default function DeferredExtras() {
  const pathname = usePathname();
  const [isDesktop, setIsDesktop] = useState(false);
  const [backgroundReady, setBackgroundReady] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)');
    const syncDesktop = () => setIsDesktop(media.matches);
    syncDesktop();
    media.addEventListener?.('change', syncDesktop);

    // Push/PWA setup is useful, but never belongs on the critical rendering path.
    const timer = window.setTimeout(() => setBackgroundReady(true), 8000);
    return () => {
      window.clearTimeout(timer);
      media.removeEventListener?.('change', syncDesktop);
    };
  }, []);

  if (isPrivateModelSharePath(pathname)) {
    return <Toaster position="bottom-center" richColors />;
  }

  return (
    <Suspense fallback={null}>
      <SiteBackdrop />
      <ConsentAwareAnalytics />
      <CopyProtection />
      <BodyImageGallery />
      <ProseContrastGuard />
      {isDesktop && <AmbientBackground />}
      {(pathname === '/' || pathname === '/services') && <WhatsAppAssistant />}
      <BackToTop />
      <CookieConsent />
      <Toaster position="bottom-center" richColors />
      {backgroundReady && (
        <>
          <NotificationManager />
          <ServiceWorkerRegister />
          <PWAInstallPrompt />
        </>
      )}
    </Suspense>
  );
}
