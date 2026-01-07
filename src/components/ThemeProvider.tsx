'use client';

import { ThemeProvider } from 'next-themes';
import { ReactNode, useEffect } from 'react';

/**
 * مزود الموضوع (Theme Provider)
 * يُستخدم في layout.tsx لتفعيل Dark Mode في التطبيق بأكمله
 * مع تحسينات: smooth transitions + prevent flash
 */
export function ThemeProviderWrapper({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Prevent flash of wrong theme on initial load
    const html = document.documentElement;

    // Add transitioning class temporarily
    html.classList.add('theme-transitioning');

    // Remove after a short delay to enable transitions
    const timer = setTimeout(() => {
      html.classList.remove('theme-transitioning');
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="daleel-theme"
      disableTransitionOnChange={false}
    >
      {children}
    </ThemeProvider>
  );
}
