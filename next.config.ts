import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',


  // 🖼️ تحسين الصور - تم التفعيل!
  // Next.js سيحسّن الصور تلقائياً ويحولها لـ WebP
  images: {
    unoptimized: false, // ✅ تفعيل التحسين التلقائي
    formats: ['image/webp', 'image/avif'], // تنسيقات حديثة أصغر حجماً
    deviceSizes: [640, 750, 828, 1080, 1200, 1920], // أحجام متجاوبة
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // أحجام الأيقونات
  },

  // ⚡ تحسين الأداء
  compress: true,

  // 🔄 تفعيل React Strict Mode للكشف عن الأخطاء المحتملة
  reactStrictMode: true,

  // 🔕 إخفاء مؤشر التطوير (زر N) في وضع التطوير
  devIndicators: ({ buildActivity: false } as unknown) as NextConfig['devIndicators'],
};

export default nextConfig;