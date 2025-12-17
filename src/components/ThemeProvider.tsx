'use client';

import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';

/**
 * مزود الموضوع (Theme Provider)
 * يُستخدم في layout.tsx لتفعيل Dark Mode في التطبيق بأكمله
 */
export function ThemeProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      {children}
    </ThemeProvider>
  );
}
