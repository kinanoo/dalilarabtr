'use client';

import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';

/**
 * مزود الموضوع (Theme Provider)
 * يُستخدم في layout.tsx لتفعيل Dark Mode في التطبيق بأكمله
 * مع تحسينات: smooth transitions + prevent flash
 */
export function ThemeProviderWrapper({ children }: { children: ReactNode }) {
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
