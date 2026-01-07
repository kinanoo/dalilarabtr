'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Bell, User, Bookmark } from 'lucide-react';
import { useState, useEffect } from 'react';

interface NavItem {
    icon: React.ElementType;
    label: string;
    href: string;
    badge?: number;
}

const navItems: NavItem[] = [
    { icon: Home, label: 'الرئيسية', href: '/' },
    { icon: Search, label: 'بحث', href: '/search' },
    { icon: Bell, label: 'إشعارات', href: '/notifications', badge: 0 },
    { icon: User, label: 'حسابي', href: '/account' },
];

export default function BottomNav() {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const handleClick = (href: string) => {
        // Haptic feedback
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 backdrop-blur-lg bg-opacity-95 dark:bg-opacity-95 animate-slideInUp">
            <div className="flex justify-around items-center h-16 px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => handleClick(item.href)}
                            className={`
                relative flex flex-col items-center justify-center
                w-full h-full gap-1
                transition-all duration-200
                ${isActive
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                }
              `}
                        >
                            {/* Badge */}
                            {item.badge && item.badge > 0 && (
                                <span className="absolute top-2 right-1/2 translate-x-3 -translate-y-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse">
                                    {item.badge > 99 ? '99+' : item.badge}
                                </span>
                            )}

                            {/* Icon */}
                            <div className={`
                transition-all duration-200
                ${isActive ? 'scale-110' : 'scale-100'}
              `}>
                                <Icon
                                    size={24}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className="icon-hover-bounce"
                                />
                            </div>

                            {/* Label */}
                            <span className={`
                text-[10px] font-bold transition-all duration-200
                ${isActive ? 'opacity-100' : 'opacity-70'}
              `}>
                                {item.label}
                            </span>

                            {/* Active Indicator */}
                            {isActive && (
                                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-emerald-600 dark:bg-emerald-400 rounded-full animate-scaleIn" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
