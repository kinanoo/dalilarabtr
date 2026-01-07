import type { Metadata } from "next";
import "./globals.css";
import "../styles/animations.css";
import "../styles/dark-mode.css";
import '@fontsource/cairo/400.css';
import '@fontsource/cairo/600.css';
import '@fontsource/cairo/700.css';
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
import CopyProtection from '@/components/ui/CopyProtection';

// ============================================
// 🔧 إعدادات الموقع - غيّر هذه القيم حسب موقعك
// ============================================
const SITE_URL = "https://dalilarab.netlify.app/"; // 👈 غيّر هذا لرابط موقعك
const SITE_NAME = "دليل العرب والسوريين في تركيا";
const SITE_DESCRIPTION = "الدليل الشامل للعرب والسوريين في تركيا حول الكملك والإقامة، الفيزا، والعمل وكل ما يلزمهم للعيش في تركيا.";

// ============================================
// 🏷️ Metadata مع Open Graph
// ============================================
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | 2025`,
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
        url: "/og-image.png",
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
    images: ["/og-image.png"],
  },

  // ✅ Favicon و Icons
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },

  // ✅ PWA Settings
  manifest: "/site.webmanifest",
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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Anti-scraping hints */}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        <meta name="description-scrape" content="unauthorized" />

        {/* Google Analytics */}
        {GA_ID && <GoogleAnalytics />}

        <GoogleAnalytics />
      </head>
      <body className={`font-cairo bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-50 min-h-screen flex flex-col transition-colors`}>
        <ThemeProviderWrapper>
          <div className="flex flex-col min-h-screen relative">
            {/* New Animated & Interactive Background */}
            <AmbientBackground />

            {/* Viral Growth Tools */}
            <SelectionShareMenu />
            <CopyProtection />

            <div className="relative z-10">
              <UrgencyBanner />
              <Navbar />
              {children}
              <Footer />
            </div>
            <ClientComponents />
            <BackToTop />
          </div>
        </ThemeProviderWrapper>
      </body>
    </html>
  );
}
