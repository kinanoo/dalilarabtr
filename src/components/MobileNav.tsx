'use client';

import Link from 'next/link';
import { Home, Briefcase, BrainCircuit } from 'lucide-react'; // تحديث الأيقونات
import { usePathname } from 'next/navigation';

export default function MobileNav() {
  const pathname = usePathname();

  const links = [
    { name: 'الرئيسية', href: '/', icon: Home },
    { name: 'الخدمات', href: '/services', icon: Briefcase },
    { name: 'المستشار', href: '/consultant', icon: BrainCircuit },
  ];

  return (
    <div className="fixed bottom-0 inset-x-0 w-full bg-white/95 dark:bg-slate-950/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)] pt-1 px-1 z-50 lg:hidden flex items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {links.map((link, idx) => {
        const isActive = pathname === link.href;
        return (
          <Link 
            key={idx} 
            href={link.href} 
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-lg transition-all duration-200 ${
              isActive ? 'text-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/20' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <link.icon size={isActive ? 18 : 16} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[8px] leading-none font-bold">{link.name}</span>
          </Link>
        );
      })}
    </div>
  );
}