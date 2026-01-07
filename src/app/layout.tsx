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
import BottomNav from "@/components/mobile/BottomNav";
import BackToTop from "@/components/BackToTop";

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
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Anti-scraping hints */}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        <meta name="description-scrape" content="unauthorized" />

        {/* Favicons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#10b981" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="msapplication-TileColor" content="#10b981" />
        <meta name="theme-color" content="#ffffff" />

        {/* Google Analytics */}
        {GA_ID && <GoogleAnalytics />}

        <script dangerouslySetInnerHTML={{
          __html: `
          (function() {
            if (typeof window === 'undefined') return;
            
            // تعطيل الاختصارات الشائعة للمعاينة (F12, Ctrl+Shift+I, Ctrl+U)
            window.addEventListener('keydown', function(e) {
              if (
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
                (e.ctrlKey && e.key === 'u')
              ) {
                e.preventDefault();
                return false;
              }
            });

            // محاولة اكتشاف فتح نافذة المطورين
            var checkDevTools = function() {
              const threshold = 160;
              const isDevToolsOpen = window.outerWidth - window.innerWidth > threshold || window.outerHeight - window.innerHeight > threshold;
              if (isDevToolsOpen) {
                // يمكن إضافة منطق لإخفاء المحتوى أو التنبيه هنا
              }
            };
            setInterval(checkDevTools, 2000);
          })();
        `}} />
        <GoogleAnalytics />
      </head>
      <body className={`font-cairo bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-50 min-h-screen flex flex-col transition-colors`}>
        <ThemeProviderWrapper>
          <div className="flex flex-col min-h-screen relative overflow-hidden">
            {/* Background Texture & Blobs - Replicated from Netlify */}
            <div className="fixed inset-0 z-[-1] pointer-events-none">
              {/* 1. Base Gradient/Color */}
              <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950 transition-colors duration-300" />

              {/* 2. Cubes Pattern */}
              <div
                className="absolute inset-0 opacity-[0.15] dark:opacity-[0.05]"
                style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }}
              />

              {/* 3. Decorative Blobs */}
              <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-normal animate-blob" />
              <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-normal animate-blob animation-delay-2000" />
              <div className="absolute -bottom-32 left-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-normal animate-blob animation-delay-4000" />
            </div>

            <div className="pb-20 lg:pb-0 relative z-10">
              <Navbar />
              {children}
            </div>
            <ClientComponents />
            <BackToTop />
          </div>
        </ThemeProviderWrapper>
      </body>
    </html>
  );
}
