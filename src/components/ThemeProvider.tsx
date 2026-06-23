'use client';

import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';

/**
 * مزود الموضوع (Theme Provider)
 * يُستخدم في layout.tsx لتفعيل Dark Mode في التطبيق بأكمله
 * مع تحسينات: smooth transitions + prevent flash
 */
export function ThemeProviderWrapper({ children, nonce }: { children: ReactNode; nonce?: string }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="daleel-theme"
      disableTransitionOnChange={false}
      // CSP nonce for the inline flash-prevention script next-themes injects.
      nonce={nonce}
    >
      {children}
    </ThemeProvider>
  );
}
