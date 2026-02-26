import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  //   output: 'export',

  // 🛡️ Security Headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://bcgwbffwzdlzlyjvlyhr.supabase.co https://www.google-analytics.com",
              "font-src 'self' data:",
              "connect-src 'self' https://bcgwbffwzdlzlyjvlyhr.supabase.co https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://www.googletagmanager.com",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // 🖼️ تحسين الصور
  // في وضع التصدير الثابت (Static Export)، لا يمكن استخدام سيرفر تحسين الصور الافتراضي.
  // لذلك يجب تفعيل وضع unoptimized أو استخدام خدمة خارجية.
  images: {
    //     unoptimized: true, // ✅ مطلوب ليعمل مع output: 'export'
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

  // ⚡ تحسين الأداء
  compress: true,

  // 🔄 تفعيل React Strict Mode للكشف عن الأخطاء المحتملة (تم التعطيل لتفادي تعارض Leaflet)
  reactStrictMode: false,

  // 🔕 إخفاء مؤشر التطوير (زر N) في وضع التطوير
  // 🔕 إخفاء مؤشر التطوير (زر N) في وضع التطوير
  devIndicators: ({ buildActivity: false } as unknown) as NextConfig['devIndicators'],

  // 🛡️ TypeScript — أخطاء البناء يجب إصلاحها قبل النشر
  // typescript: { ignoreBuildErrors: true }, // ❌ تم الإزالة لضمان سلامة الكود

  // @ts-ignore - Explicitly requested by next.js warning for local cross-origin
  allowedDevOrigins: ['http://192.168.18.3:3000', '192.168.18.3:3000'],
};

export default nextConfig;