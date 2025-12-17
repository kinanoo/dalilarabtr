'use client';

import Link from 'next/link';
import { Home, FileText, Briefcase, BrainCircuit, Search } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function MobileNav() {
  const pathname = usePathname();

  const links = [
    { name: 'الرئيسية', href: '/', icon: Home },
    { name: 'الدليل', href: '/directory', icon: FileText },
    { name: 'المستشار', href: '/consultant', icon: BrainCircuit },
    { name: 'الخدمات', href: '/services', icon: Briefcase },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 w-full bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)] z-50 lg:hidden shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-around px-1 py-1">
        {links.map((link) => {
          const isActive = pathname === link.href || 
            (link.href !== '/' && pathname?.startsWith(link.href));
          
          return (
            <Link 
              key={link.href} 
              href={link.href} 
              className={`flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-xl transition-all duration-200 min-w-[56px] ${
                isActive 
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30' 
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 active:bg-slate-100 dark:active:bg-slate-800'
              }`}
            >
              <link.icon 
                size={isActive ? 22 : 20} 
                strokeWidth={isActive ? 2.5 : 2} 
                className="transition-all duration-200"
              />
              <span className={`text-[10px] leading-none font-bold transition-all duration-200 ${
                isActive ? 'text-emerald-700 dark:text-emerald-300' : ''
              }`}>
                {link.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
