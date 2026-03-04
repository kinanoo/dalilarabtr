'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * زر تبديل الوضع المظلم (Dark Mode Toggle)
 * يظهر في شريط التنقل (Navbar)
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // تجنب hydration mismatch (مشكلة شائعة في Next.js)
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />;
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={() => {
        const html = document.documentElement;
        html.classList.add('theme-switching');
        setTheme(isDark ? 'light' : 'dark');
        setTimeout(() => html.classList.remove('theme-switching'), 400);
      }}
      className="p-2.5 min-w-11 min-h-11 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
      aria-label="تبديل الوضع المظلم"
      title={isDark ? 'وضع فاتح' : 'وضع مظلم'}
    >
      {isDark ? (
        <Sun size={16} className="text-amber-500" />
      ) : (
        <Moon size={16} className="text-slate-600" />
      )}
    </button>
  );
}
