import type { NextConfig } from "next";

// Shared CSP directives (reused for global + admin)
const cspBase = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline' https://vercel.live",
  "img-src 'self' data: blob: https://bcgwbffwzdlzlyjvlyhr.supabase.co https://www.google-analytics.com https://grainy-gradients.vercel.app https://www.google.com https://www.transparenttextures.com https://vercel.live https://vercel.com https://*.vercel.com https://googleads.g.doubleclick.net https://www.googleadservices.com",
  "font-src 'self' data: https://vercel.live",
  "connect-src 'self' https://bcgwbffwzdlzlyjvlyhr.supabase.co https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://www.googletagmanager.com https://vercel.live https://*.vercel.live wss://*.pusher.com https://static.cloudflareinsights.com https://www.google.com https://googleads.g.doubleclick.net https://www.googleadservices.com",
  "frame-src 'self' https://tckimlik.nvi.gov.tr https://vercel.live",
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
  `script-src 'self' 'unsafe-inline'${DEV_EVAL} https://www.googletagmanager.com https://www.google-analytics.com https://vercel.live https://static.cloudflareinsights.com https://googleads.g.doubleclick.net https://www.googleadservices.com`,
].join('; ');

// Admin: WITH unsafe-eval (required by Monaco Editor in StaticPageEditor)
const cspAdmin = [
  ...cspBase,
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://vercel.live https://static.cloudflareinsights.com https://googleads.g.doubleclick.net https://www.googleadservices.com",
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
    ];
  },

  // 🖼️ Image optimization
  //
  // unoptimized: true — required for Cloudflare Pages migration.
  // Vercel's image optimizer is a Vercel-only runtime (a managed image
  // CDN at /_next/image). Cloudflare Pages has no equivalent; if we leave
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
  // they're ignored when unoptimized=true but useful if we ever flip
  // back to a host that does image optimization (Vercel, self-hosted
  // with an image service, etc).
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bcgwbffwzdlzlyjvlyhr.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
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

  // 🔄 React Strict Mode — enabled for better performance and bug detection
  reactStrictMode: true,

  // 🔕 Hide dev indicator
  devIndicators: ({ buildActivity: false } as unknown) as NextConfig['devIndicators'],

  // @ts-ignore - Explicitly requested by next.js warning for local cross-origin
  allowedDevOrigins: ['http://192.168.18.3:3000', '192.168.18.3:3000'],
};

export default nextConfig;
