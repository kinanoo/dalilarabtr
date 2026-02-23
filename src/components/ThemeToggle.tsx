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
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
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
