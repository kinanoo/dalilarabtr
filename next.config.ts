import type { NextConfig } from "next";

// Shared CSP directives (reused for global + admin)
const cspBase = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://bcgwbffwzdlzlyjvlyhr.supabase.co https://lh3.googleusercontent.com https://www.google-analytics.com https://www.google.com https://www.transparenttextures.com https://googleads.g.doubleclick.net https://www.googleadservices.com",
  "font-src 'self' data:",
  "connect-src 'self' https://bcgwbffwzdlzlyjvlyhr.supabase.co https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://www.googletagmanager.com wss://*.pusher.com https://static.cloudflareinsights.com https://www.google.com https://googleads.g.doubleclick.net https://www.googleadservices.com",
  "frame-src 'self' https://tckimlik.nvi.gov.tr",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  // Block legacy plug-ins (Flash, Java) outright — closes a class of XSS
  // pivots that 'unsafe-inline' can't.
  "object-src 'none'",
  // Web workers and the service worker only ever come from our own origin
  // (or a blob created by us). Keeps an attacker from registering a hostile
  // worker via an injected script string.
  "worker-src 'self' blob:",
  "manifest-src 'self'",
];

// In DEV ONLY, React Fast Refresh / dev tooling needs eval(); production never
// does. Gate 'unsafe-eval' on NODE_ENV so it's present only under `next dev`,
// keeping the DEPLOYED CSP strict. (next build sets NODE_ENV=production, so the
// shipped CSP has no unsafe-eval — verified post-deploy.) Without this, the dev
// CSP blocked eval and broke the local preview renderer (screenshots timed out).
const DEV_EVAL = process.env.NODE_ENV !== 'production' ? " 'unsafe-eval'" : '';

// Global: unsafe-eval ONLY in dev (see DEV_EVAL); public prod pages don't need it.
const cspGlobal = [
  ...cspBase,
  `script-src 'self' 'unsafe-inline'${DEV_EVAL} https://www.googletagmanager.com https://www.google-analytics.com https://static.cloudflareinsights.com https://googleads.g.doubleclick.net https://www.googleadservices.com`,
].join('; ');

// Admin: same strict script-src as the public site — 'unsafe-eval' in PROD is
// gone. Its only stated reason was Monaco Editor in StaticPageEditor, and that
// component was dead code (nothing imported it, it was in no built bundle);
// both it and the @monaco-editor/react dependency are now deleted. No remaining
// dependency evals: TipTap/ProseMirror, Leaflet, framer-motion, date-fns don't,
// and our own src has no eval()/new Function(). unsafe-eval is a serious XSS
// amplifier, so keeping it for a deleted component would be a hole for nothing.
// DEV_EVAL still grants it under `next dev` for React Fast Refresh only.
// If a future admin feature genuinely needs eval, prefer a nonce/hash over
// re-opening unsafe-eval site-wide for /admin.
const cspAdmin = [
  ...cspBase,
  `script-src 'self' 'unsafe-inline'${DEV_EVAL} https://www.googletagmanager.com https://www.google-analytics.com https://static.cloudflareinsights.com https://googleads.g.doubleclick.net https://www.googleadservices.com`,
].join('; ');

// Shared security headers (applied to all routes)
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
];

const nextConfig: NextConfig = {
  //   output: 'export',

  // 🛡️ Security Headers
  async headers() {
    return [
      {
        // Global security headers (catch-all — applied first, overridden by specific rules below)
        source: '/(.*)',
        headers: [
          ...securityHeaders,
          { key: 'Content-Security-Policy', value: cspGlobal },
        ],
      },
      {
        // Static OG fallback image
        source: '/og-image.jpg',
        headers: [
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Admin pages: override CSP + prevent browser caching sensitive data,
        // and tell search engines to stay out (admin URLs should never
        // appear in Google results even if a link leaks).
        source: '/admin/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: cspAdmin },
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
        ],
      },
      {
        // Admin API endpoints: same no-cache + no-index discipline
        source: '/api/admin/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },

  // 🔀 301 Redirects (old Arabic slugs → English)
  async redirects() {
    return [
      {
        source: '/article/%D8%AF%D9%84%D9%8A%D9%84-%D8%A7%D9%84%D8%AA%D9%82%D8%AF%D9%8A%D9%85-%D8%B9%D9%84%D9%89-%D8%A7%D9%84%D8%AC%D9%86%D8%B3%D9%8A%D8%A9-%D8%A7%D9%84%D8%AA%D8%B1%D9%83%D9%8A%D8%A9-%D8%B9%D8%A8%D8%B1-%D8%A7%D9%84%D8%B2%D9%88%D8%A7%D8%AC-%D9%84%D9%84%D8%B3%D9%88%D8%B1%D9%8A%D9%8A%D9%86-%D9%81%D9%8A-%D8%BA%D8%A7%D8%B2%D9%8A-%D8%B9%D9%86%D8%AA%D8%A7%D8%A8',
        destination: '/article/turkish-citizenship-marriage-syrians-gaziantep',
        permanent: true,
      },
      // Work visa article — Arabic ID → English slug
      {
        source: '/article/%D8%AA%D8%A3%D8%B4%D9%8A%D8%B1%D8%A9-%D8%A7%D9%84%D8%B9%D9%85%D9%84-%D9%81%D9%8A-%D8%AA%D8%B1%D9%83%D9%8A%D8%A7-%D8%AF%D9%84%D9%8A%D9%84-%D8%B4%D8%A7%D9%85%D9%84-%D9%84%D9%84%D8%AD%D8%B5%D9%88%D9%84-%D8%B9%D9%84%D9%89-%D9%81%D9%8A%D8%B2%D8%A7-%D8%A7%D9%84%D8%B9%D9%85%D9%84-%D8%A7%D9%84%D8%AA%D8%B1%D9%83%D9%8A%D8%A9-mmculitg',
        destination: '/article/turkey-work-visa-guide',
        permanent: true,
      },
      // Work visa article — old Arabic slug → English slug
      {
        source: '/article/%D8%AA%D8%A3%D8%B4%D9%8A%D8%B1%D8%A9-%D8%A7%D9%84%D8%B9%D9%85%D9%84-%D9%81%D9%8A-%D8%AA%D8%B1%D9%83%D9%8A%D8%A7-%D8%AF%D9%84%D9%8A%D9%84-%D8%B4%D8%A7%D9%85%D9%84-%D9%84%D9%84%D8%AD%D8%B5%D9%88%D9%84-%D8%B9%D9%84%D9%89-%D9%81%D9%8A%D8%B2%D8%A7-%D8%A7%D9%84%D8%B9%D9%85%D9%84-%D8%A7%D9%84%D8%AA%D8%B1%D9%83%D9%8A%D8%A9',
        destination: '/article/turkey-work-visa-guide',
        permanent: true,
      },
      // Per-service request landing pages were removed — send any old
      // /request/<serviceId> URL to the main request page (no 404s).
      {
        source: '/request/:service',
        destination: '/request',
        permanent: true,
      },
    ];
  },

  // 🖼️ Image optimization
  //
  // unoptimized: true - required for the Cloudflare Workers/OpenNext runtime.
  // This deployment does not run a compatible Next image optimizer; if we leave
  // optimization on, every <Image> renders a /_next/image URL that 404s.
  //
  // What changes for users:
  //   - Images load directly from Supabase Storage at their original
  //     dimensions. No on-the-fly WebP/AVIF conversion or resize.
  //   - This is fine for us because Supabase Storage already serves
  //     reasonably-sized images uploaded by admin (we watermark + size
  //     them at upload time — see lib/watermark.ts).
  //   - `priority`, `fill`, `sizes`, `onError`, and `placeholder` still
  //     work. Only the URL rewriting through /_next/image is disabled.
  //   - No `placeholder="blur"` is used anywhere in src/ (grep confirms),
  //     so we don't need to ship a static blurDataURL fallback.
  //
  // remotePatterns + formats + deviceSizes + imageSizes are retained as
  // documentation of what URLs we expect and what sizes Supabase serves —
  // they're ignored when unoptimized=true but document the only external image
  // host the site should load from.
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bcgwbffwzdlzlyjvlyhr.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'bcgwbffwzdlzlyjvlyhr.supabase.co',
        port: '',
        pathname: '/storage/v1/render/image/public/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // 🛡️ Hide X-Powered-By header
  poweredByHeader: false,

  // ⚡ Performance
  compress: true,

  // 📦 Tree-shake large icon/animation libraries
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'date-fns'],
  },

  // 🔕 Strip console.* (except error/warn) from the PRODUCTION bundle. The site
  // has many logger/console calls; dropping them shrinks client JS a touch and
  // stops debug noise/info leaking to visitors' consoles. error+warn are kept
  // so genuine problems still surface.
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // 🔄 React Strict Mode — enabled for better performance and bug detection
  reactStrictMode: true,

  // 🔕 Hide dev indicator
  devIndicators: ({ buildActivity: false } as unknown) as NextConfig['devIndicators'],

  allowedDevOrigins: ['http://192.168.18.3:3000', '192.168.18.3:3000'],
};

export default nextConfig;
