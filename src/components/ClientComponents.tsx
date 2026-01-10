/**
 * 🎯 Client Components Wrapper
 * ============================
 * 
 * هذا الملف يجمع المكونات التي تحتاج Client-side rendering
 * ويستخدم dynamic imports لتحسين الأداء
 */

'use client';

import { lazy, Suspense } from 'react';
import { Toaster } from 'sonner';

const WhatsAppAssistant = lazy(() => import('./WhatsAppAssistant'));

export default function ClientComponents() {
  return (
    <Suspense fallback={null}>
      <WhatsAppAssistant />
      <Toaster position="bottom-center" richColors />
    </Suspense>
  );
}
