import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  
  // 🖼️ تحسين الصور
  images: {
    unoptimized: true,
  },
  
  // ⚡ تحسين الأداء
  compress: true,
  
  // 🔄 تفعيل React Strict Mode للكشف عن الأخطاء المحتملة
  reactStrictMode: true,

  // 🔕 إخفاء مؤشر التطوير (زر N) في وضع التطوير
  devIndicators: ({ buildActivity: false } as unknown) as NextConfig['devIndicators'],
};

export default nextConfig;