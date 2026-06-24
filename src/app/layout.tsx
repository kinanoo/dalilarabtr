import type { Metadata } from "next";
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import "./globals.css";
import "../styles/animations.css";
import "../styles/dark-mode.css";
import { Cairo, Tajawal } from 'next/font/google';

// Cairo stays for body text — its lighter weights (400/600/700) render
// well in long-form Arabic paragraphs.
const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-cairo',
  preload: true,
});

// Tajawal is loaded ONLY for headings. The user reported Cairo Black
// (font-black, weight 900) had cramped letterforms where Arabic letters
// touched each other on bold news headlines. Tajawal's 800/900 weights
// have cleaner kerning + better letter separation — closer to the
// official-government look on sites like mofaex.gov.sy. Exposed as a CSS
// custom property `--font-tajawal` and routed via globals.css to every
// heading element (h1-h6) + `.font-black` utility.
const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['700', '800', '900'],
  display: 'swap',
  variable: '--font-tajawal',
  preload: true,
});
import { ThemeProviderWrapper } from "@/components/ThemeProvider";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import LatinDigits from "@/components/LatinDigits";
import ChunkReloadGuard from "@/components/ChunkReloadGuard";
import { SEO_KEYWORDS } from "@/lib/keywords";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollRestoration from "@/components/ScrollRestoration";
import { generateOrganizationSchema, generateWebSiteSchema } from "@/lib/schemaOrg";

// Non-critical above-fold components — lazy loaded to reduce initial JS
const UrgencyBanner = dynamic(() => import('@/components/UrgencyBanner'));

// Wrapper that delays rendering until browser is idle (~2.5s after page load)
const LazyGroup = dynamic(() => import("@/components/ui/LazyGroup"));

// All non-critical components in one deferred bundle (loaded after idle)
const DeferredExtras = dynamic(() => import("@/components/DeferredExtras"));

// Web Vitals — reports LCP, FID, CLS, FCP, TTFB, INP to Google Analytics
const WebVitals = dynamic(() => import('@/components/WebVitals').then(m => ({ default: m.WebVitals })));

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
    // Year is computed at build/render time so the title never goes stale.
    default: `${SITE_NAME} | ${new Date().getFullYear()}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SEO_KEYWORDS,
  // Default crawl policy for the whole site. Individual pages override this
  // with `robots: { index: false }` (article/zones 404s, individual
  // neighbourhood pages, admin) and the override wins cleanly.
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
  },
  alternates: {
    languages: {
      'ar': SITE_URL,
      'x-default': SITE_URL,
    },
  },
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,

  // ✅ Open Graph (للمشاركة على فيسبوك وغيره)
  openGraph: {
    type: "website",
    locale: "ar_TR",
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
    <html lang="ar" dir="rtl" suppressHydrationWarning className={`${cairo.variable} ${tajawal.variable}`}>
      <head>
        {/*
         * esbuild `--keep-names` polyfill.
         *
         * OpenNext bundles the Cloudflare Worker with esbuild's keepNames
         * option on, which emits inline `__name(target, "name")` calls in
         * the SSR/RSC output. The helper that defines `__name` should be
         * injected at the top of the bundle but currently isn't — so the
         * browser hits `ReferenceError: __name is not defined` on the
         * very first inline <script> in the HTML response.
         *
         * Visually the page still renders (HTML is server-streamed
         * before the script runs) but hydration aborts: forms don't
         * submit, buttons don't react, client-only components stay
         * dead. That's a deal-breaker for /admin login, push
         * subscribe, bookmarks, the AI assistant, and every other
         * interactive surface.
         *
         * Fix: define a no-op-compatible polyfill on `globalThis` in
         * <head> BEFORE Next's chunks land. The shape matches what
         * esbuild emits — assign the function's display name via
         * defineProperty and return the target. Safe to run twice
         * (idempotent), safe with SSR (no DOM access).
         *
         * Remove this once OpenNext ships a fix for the missing
         * helper preamble (tracked in their issues).
         */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'if(typeof globalThis.__name!=="function"){globalThis.__name=function(t,v){try{Object.defineProperty(t,"name",{value:v,configurable:true})}catch(e){}return t}}',
          }}
        />

        {/* NOTE: the global robots/googlebot policy is set via the Metadata
            API `robots` field below (export const metadata), NOT a hardcoded
            <meta> here. A static index,follow tag in <head> collided with
            per-page `robots: { index: false }` (e.g. the article/zones 404s,
            admin pages): two robots tags on one page, which is a fragile
            signal. Letting the Metadata API own it means a page that opts out
            cleanly emits a single noindex tag. */}

        {/* Google Search Console verification */}
        {process.env.NEXT_PUBLIC_GSC_VERIFICATION && (
          <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GSC_VERIFICATION} />
        )}

        {/* PWA theme color */}
        <meta name="theme-color" content="#10b981" />

        {/* Sitemap discovery */}
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />

        {/* RSS feed — picked up by feed readers (Feedly, NetNewsWire) and
            relay/automation tools (IFTTT/Zapier → Telegram, Slack, Discord).
            This single line opens every RSS-consuming distribution channel. */}
        <link
            rel="alternate"
            type="application/rss+xml"
            title="دليل العرب والسوريين في تركيا — RSS"
            href="/feed.xml"
        />

        {/* Preconnect to external services for faster loading */}
        <link rel="preconnect" href="https://bcgwbffwzdlzlyjvlyhr.supabase.co" />
        <link rel="dns-prefetch" href="https://bcgwbffwzdlzlyjvlyhr.supabase.co" />
        <link rel="preconnect" href="https://api.aladhan.com" />
        <link rel="dns-prefetch" href="https://api.aladhan.com" />

        {/* Google Analytics */}
        {GA_ID && <GoogleAnalytics />}
      </head>
      <body suppressHydrationWarning className={`font-cairo bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-50 min-h-screen flex flex-col transition-colors`}>
        {/* Web Vitals — reports LCP, CLS, INP to Google Analytics */}
        {GA_ID && <WebVitals />}
        {/* Structured Data — in body to prevent Next.js head duplication */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateOrganizationSchema()) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateWebSiteSchema()) }} />
        {/* Skip to main content for keyboard/screen reader users */}
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:right-4 focus:z-[9999] focus:bg-emerald-600 focus:text-white focus:p-3 focus:rounded-xl focus:font-bold">
          تخطي إلى المحتوى الرئيسي
        </a>
        {/* Eastern-Arabic → Latin digit normalizer. Walks every text node
            on mount and via MutationObserver after, so any ٠-٩ that slips
            in from articles, DB content, or hardcoded JSX strings becomes
            0-9 in the rendered DOM. Site-wide guarantee. */}
        <LatinDigits />
        {/* Self-heals the "click → stuck on loading skeleton" symptom after a
            deploy: hard-reloads once when a stale chunk fails to load. */}
        <ChunkReloadGuard />
        <ThemeProviderWrapper>
          <ScrollRestoration />
          <div className="flex flex-col min-h-screen relative">
            <div className="relative z-10">
              <UrgencyBanner />
              <Navbar />
              <div id="main-content">
                {children}
              </div>
              <Footer />
            </div>

            {/* Non-critical components — deferred until browser is idle */}
            <LazyGroup>
              <DeferredExtras />
            </LazyGroup>
          </div>
        </ThemeProviderWrapper>
      </body>
    </html>
  );
}
