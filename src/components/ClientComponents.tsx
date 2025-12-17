/**
 * 🎯 Client Components Wrapper
 * ============================
 * 
 * هذا الملف يجمع المكونات التي تحتاج Client-side rendering
 * ويستخدم dynamic imports لتحسين الأداء
 */

'use client';

import dynamic from 'next/dynamic';

// ⚡ Lazy Loading للمكونات الثقيلة
const WhatsAppAssistant = dynamic(() => import('@/components/WhatsAppAssistant'), {
  ssr: false,
});

const MobileNav = dynamic(() => import('@/components/MobileNav'), {
  ssr: false,
});

const ScrollToTop = dynamic(() => import('@/components/ScrollToTop'), {
  ssr: false,
});

/**
 * مكون يجمع جميع Client Components
 */
export default function ClientComponents() {
  return (
    <>
      <MobileNav />
      <WhatsAppAssistant />
      <ScrollToTop />
    </>
  );
}

