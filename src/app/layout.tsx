import type { Metadata } from "next";
import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import "./globals.css";
import "../styles/animations.css";
import "../styles/dark-mode.css";
import { IBM_Plex_Sans_Arabic } from 'next/font/google';

// One shared font declaration serves body copy and headings. A second call for
// the same family duplicated font files in the critical path.
const cairo = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  // Regular and bold cover the site hierarchy; intermediate weights are
  // synthesized by the browser instead of downloading four extra font files.
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-cairo',
  preload: true,
});
import { ThemeProviderWrapper } from "@/components/ThemeProvider";
import LatinDigits from "@/components/LatinDigits";
import ChunkReloadGuard from "@/components/ChunkReloadGuard";
import { SEO_KEYWORDS } from "@/lib/keywords";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollRestoration from "@/components/ScrollRestoration";
import TapFeedbackPulse from "@/components/TapFeedbackPulse";
import { generateOrganizationSchema, generateWebSiteSchema } from "@/lib/schemaOrg";

// Wrapper that delays rendering until browser is idle (~2.5s after page load)
const LazyGroup = dynamic(() => import("@/components/ui/LazyGroup"));

// All non-critical components in one deferred bundle (loaded after idle)
const DeferredExtras = dynamic(() => import("@/components/DeferredExtras"));

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
        url: "/og-banner.jpg",
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },

  // ✅ Twitter Card — card TYPE only, deliberately no title/description/image.
  // Telegram (and X) prefer twitter:* over og:* when both exist, so site-wide
  // twitter defaults here made every inner page that only sets openGraph
  // unfurl with the generic marble og-image + site name instead of its own
  // generated title card (proven on /updates/{id} link previews). With only
  // the card type declared, crawlers fall back to each page's og:* tags.
  twitter: {
    card: "summary_large_image",
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
  children: ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className={cairo.variable}>
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
        <link rel="sitemap" type="application/xml" href="/server-sitemap-index.xml" />

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
      </head>
      <body suppressHydrationWarning className={`font-cairo bg-surface-light dark:bg-slate-950 text-slate-900 dark:text-slate-50 min-h-screen flex flex-col transition-colors`}>
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
        <TapFeedbackPulse />
        <ThemeProviderWrapper>
          <ScrollRestoration />
          <div className="flex flex-col min-h-screen relative">
            {/* Faint Istanbul photo behind everything (z-0, fixed) now mounts
                from DeferredExtras: it imports the full supabase-js client for
                its DB config, and importing it statically here put ~63KB gz of
                supabase into the critical path of EVERY page. Its z-0/fixed
                positioning is unaffected by DOM order within this container. */}
            <div className="relative z-10">
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
