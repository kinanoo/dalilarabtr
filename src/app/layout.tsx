import type { Metadata } from "next";
import { Suspense } from 'react';
import "./globals.css";
import "../styles/animations.css";
import "../styles/dark-mode.css";
import '@fontsource/cairo/400.css';
import { ThemeProviderWrapper } from "@/components/ThemeProvider";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import ClientComponents from "@/components/ClientComponents";
import { SEO_KEYWORDS } from "@/lib/keywords";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/mobile/BottomNav";
import BackToTop from "@/components/BackToTop";
import UrgencyBanner from '@/components/UrgencyBanner';
import AmbientBackground from "@/components/ui/AmbientBackground";
import SelectionShareMenu from '@/components/ui/SelectionShareMenu';
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker"; // New Import
import NotificationManager from "@/components/NotificationManager";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import FontLoader from "@/components/FontLoader";
import NewsTicker from "@/components/NewsTicker";
import CookieConsent from "@/components/CookieConsent";

// ============================================
// 🔧 إعدادات الموقع - غيّر هذه القيم حسب موقعك
// ============================================
import { SITE_CONFIG } from "@/lib/config";
const SITE_URL = SITE_CONFIG.siteUrl; // 👈 غيّر هذا لرابط موقعك الدائم لاحقاً
const SITE_NAME = SITE_CONFIG.name;
const SITE_DESCRIPTION = "الدليل الشامل للعرب والسوريين في تركيا حول الكملك والإقامة، الفيزا، والعمل وكل ما يلزمهم للعيش في تركيا.";

// ============================================
// 🏷️ Metadata مع Open Graph
// ============================================
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | 2026`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SEO_KEYWORDS,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,

  // ✅ Open Graph (للمشاركة على فيسبوك وغيره)
  openGraph: {
    type: "website",
    locale: "ar_SA",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },

  // ✅ Twitter Card
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/og-image.jpg"],
  },

  // ✅ Favicon و Icons
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },

  // ✅ PWA Settings
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },
  formatDetection: {
    telephone: false,
  },
};

// ============================================
// 🏠 Layout الرئيسي
// ============================================
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Google Analytics ID from environment variable
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/* Anti-scraping hints */}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        <meta name="description-scrape" content="unauthorized" />

        {/* Google Search Console verification */}
        {process.env.NEXT_PUBLIC_GSC_VERIFICATION && (
          <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GSC_VERIFICATION} />
        )}

        {/* PWA theme color */}
        <meta name="theme-color" content="#10b981" />

        {/* Preconnect to external services for faster loading */}
        <link rel="preconnect" href="https://bcgwbffwzdlzlyjvlyhr.supabase.co" />
        <link rel="dns-prefetch" href="https://bcgwbffwzdlzlyjvlyhr.supabase.co" />
        <link rel="preconnect" href="https://api.aladhan.com" />
        <link rel="dns-prefetch" href="https://api.aladhan.com" />

        {/* Google Analytics */}
        {GA_ID && <GoogleAnalytics />}
      </head>
      <body className={`font-cairo bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-50 min-h-screen flex flex-col transition-colors`}>
        {/* Skip to main content for keyboard/screen reader users */}
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:right-4 focus:z-[9999] focus:bg-emerald-600 focus:text-white focus:p-3 focus:rounded-xl focus:font-bold">
          تخطي إلى المحتوى الرئيسي
        </a>
        <ThemeProviderWrapper>
          <div className="flex flex-col min-h-screen relative">
            {/* New Animated & Interactive Background */}
            <AmbientBackground />

            {/* Suspense is required because AnalyticsTracker uses useSearchParams */}
            <Suspense fallback={null}>
              <AnalyticsTracker />
            </Suspense>

            <NotificationManager />

            {/* Viral Growth Tools */}
            <SelectionShareMenu />

            {/* PWA Components */}
            <ServiceWorkerRegister />
            <PWAInstallPrompt />
            <FontLoader />

            <div className="relative z-10">
              <UrgencyBanner />
              <Navbar />
              <NewsTicker />
              <div id="main-content">
                {children}
              </div>
              <Footer />
            </div>
            <ClientComponents />
            <BackToTop />
            <CookieConsent />
          </div>
        </ThemeProviderWrapper>
      </body>
    </html>
  );
}
