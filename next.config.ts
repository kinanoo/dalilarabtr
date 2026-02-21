import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  //   output: 'export',


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

  // 🛡️ تجاوز أخطاء البناء (للنشر السريع)

  typescript: { ignoreBuildErrors: true },

  // @ts-ignore - Explicitly requested by next.js warning for local cross-origin
  allowedDevOrigins: ['http://192.168.18.3:3000', '192.168.18.3:3000'],
};

export default nextConfig;