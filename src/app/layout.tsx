import type { Metadata } from "next";
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import "./globals.css";
import "../styles/animations.css";
import "../styles/dark-mode.css";
import { Cairo } from 'next/font/google';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-cairo',
  preload: true,
});
import { ThemeProviderWrapper } from "@/components/ThemeProvider";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { SEO_KEYWORDS } from "@/lib/keywords";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import UrgencyBanner from '@/components/UrgencyBanner';
import NewsTicker from "@/components/NewsTicker";

// Non-critical components — code-split into separate chunks to reduce initial JS bundle
const AmbientBackground = dynamic(() => import("@/components/ui/AmbientBackground"));
const AnalyticsTracker = dynamic(() => import("@/components/analytics/AnalyticsTracker").then(m => ({ default: m.AnalyticsTracker })));
const NotificationManager = dynamic(() => import("@/components/NotificationManager"));
const SelectionShareMenu = dynamic(() => import("@/components/ui/SelectionShareMenu"));
const ServiceWorkerRegister = dynamic(() => import("@/components/pwa/ServiceWorkerRegister"));
const PWAInstallPrompt = dynamic(() => import("@/components/PWAInstallPrompt"));
const ClientComponents = dynamic(() => import("@/components/ClientComponents"));
const BackToTop = dynamic(() => import("@/components/BackToTop"));
const CookieConsent = dynamic(() => import("@/components/CookieConsent"));

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
    <html lang="ar" dir="rtl" suppressHydrationWarning className={cairo.variable}>
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

            <Suspense fallback={null}>
              <AnalyticsTracker />
            </Suspense>

            <NotificationManager />

            {/* Viral Growth Tools */}
            <SelectionShareMenu />

            {/* PWA Components */}
            <ServiceWorkerRegister />
            <PWAInstallPrompt />

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
