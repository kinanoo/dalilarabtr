'use client';

import { lazy, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { Toaster } from 'sonner';
import { isPrivateModelSharePath } from '@/lib/models/routes';

const AmbientBackground = lazy(() => import('@/components/ui/AmbientBackground'));
const AnalyticsTracker = lazy(() => import('@/components/analytics/AnalyticsTracker').then(m => ({ default: m.AnalyticsTracker })));
const ConversionEvents = lazy(() => import('@/components/analytics/ConversionEvents').then(m => ({ default: m.ConversionEvents })));
const NotificationManager = lazy(() => import('@/components/NotificationManager'));
const CopyProtection = lazy(() => import('@/components/ui/CopyProtection'));
const ServiceWorkerRegister = lazy(() => import('@/components/pwa/ServiceWorkerRegister'));
const PWAInstallPrompt = lazy(() => import('@/components/PWAInstallPrompt'));
const ClientComponents = lazy(() => import('@/components/ClientComponents'));
const BackToTop = lazy(() => import('@/components/BackToTop'));
const CookieConsent = lazy(() => import('@/components/CookieConsent'));

export default function DeferredExtras() {
  const pathname = usePathname();

  if (isPrivateModelSharePath(pathname)) {
    return <Toaster position="bottom-center" richColors />;
  }

  return (
    <Suspense fallback={null}>
      <AmbientBackground />
      <AnalyticsTracker />
      <ConversionEvents />
      <NotificationManager />
      <CopyProtection />
      <ServiceWorkerRegister />
      <PWAInstallPrompt />
      <ClientComponents />
      <BackToTop />
      <CookieConsent />
    </Suspense>
  );
}
