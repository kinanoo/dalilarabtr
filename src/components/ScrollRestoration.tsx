'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Scroll to top on every route change
 * يحل مشكلة الصفحة اللي بتفتح بالنص أو بالأسفل
 */
export default function ScrollRestoration() {
  const pathname = usePathname();

  useEffect(() => {
    // Scroll to top immediately on route change
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
