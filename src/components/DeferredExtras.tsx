'use client';

import { lazy, Suspense } from 'react';

const AmbientBackground = lazy(() => import('@/components/ui/AmbientBackground'));
const AnalyticsTracker = lazy(() => import('@/components/analytics/AnalyticsTracker').then(m => ({ default: m.AnalyticsTracker })));
const NotificationManager = lazy(() => import('@/components/NotificationManager'));
const CopyProtection = lazy(() => import('@/components/ui/CopyProtection'));
const ServiceWorkerRegister = lazy(() => import('@/components/pwa/ServiceWorkerRegister'));
const PWAInstallPrompt = lazy(() => import('@/components/PWAInstallPrompt'));
const ClientComponents = lazy(() => import('@/components/ClientComponents'));
const BackToTop = lazy(() => import('@/components/BackToTop'));
const CookieConsent = lazy(() => import('@/components/CookieConsent'));

export default function DeferredExtras() {
  return (
    <Suspense fallback={null}>
      <AmbientBackground />
      <AnalyticsTracker />
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
