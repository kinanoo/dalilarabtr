import type { NextConfig } from "next";

// Shared CSP directives (reused for global + admin)
const cspBase = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://bcgwbffwzdlzlyjvlyhr.supabase.co https://www.google-analytics.com https://grainy-gradients.vercel.app https://www.google.com",
  "font-src 'self' data:",
  "connect-src 'self' https://bcgwbffwzdlzlyjvlyhr.supabase.co https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://www.googletagmanager.com",
  "frame-src 'self' https://tckimlik.nvi.gov.tr",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
];

// Global: NO unsafe-eval (public pages don't need it)
const cspGlobal = [
  ...cspBase,
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
].join('; ');

// Admin: WITH unsafe-eval (required by Monaco Editor in StaticPageEditor)
const cspAdmin = [
  ...cspBase,
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
].join('; ');

// Shared security headers (applied to all routes)
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
];

const nextConfig: NextConfig = {
  //   output: 'export',

  // 🛡️ Security Headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          ...securityHeaders,
          { key: 'Content-Security-Policy', value: cspGlobal },
        ],
      },
      {
        // Admin pages: override CSP + prevent browser caching sensitive data
        source: '/admin/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: cspAdmin },
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
    ];
  },

  // 🖼️ Image optimization
  images: {
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

  // ⚡ Performance
  compress: true,

  // 📦 Tree-shake large icon/animation libraries
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'date-fns'],
  },

  // 🔄 React Strict Mode disabled for Leaflet map compatibility
  reactStrictMode: false,

  // 🔕 Hide dev indicator
  devIndicators: ({ buildActivity: false } as unknown) as NextConfig['devIndicators'],

  // @ts-ignore - Explicitly requested by next.js warning for local cross-origin
  allowedDevOrigins: ['http://192.168.18.3:3000', '192.168.18.3:3000'],
};

export default nextConfig;
