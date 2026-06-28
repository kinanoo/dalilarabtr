'use client';

/**
 * MobileBottomNav — a sticky app-style bottom bar for the admin panel on
 * phones/tablets (hidden ≥ xl, where the full sidebar is always visible).
 *
 * Before this, switching sections on mobile meant: tap hamburger → wait for
 * the drawer → tap a link → drawer closes. Two taps + a drawer animation
 * every single time. This gives one-tap access to the four sections the
 * owner actually lives in, plus a "المزيد" button that opens the full drawer
 * for everything else. The active section is highlighted so you always know
 * where you are.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Megaphone, Radio, Menu } from 'lucide-react';

const ITEMS = [
    { href: '/admin', label: 'الرئيسية', icon: LayoutDashboard, exact: true },
    { href: '/admin/articles', label: 'المقالات', icon: FileText },
    { href: '/admin/updates', label: 'التحديثات', icon: Megaphone },
    { href: '/admin/push-broadcast', label: 'بثّ', icon: Radio },
];

export function MobileBottomNav({ onMore }: { onMore: () => void }) {
    const pathname = usePathname();
    const isActive = (href: string, exact?: boolean) =>
        exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');

    return (
        <nav
            className="xl:hidden fixed bottom-0 inset-x-0 z-[70] bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_24px_rgba(0,0,0,0.07)]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div className="grid grid-cols-5 h-16">
                {ITEMS.map((it) => {
                    const active = isActive(it.href, it.exact);
                    const Icon = it.icon;
                    return (
                        <Link
                            key={it.href}
                            href={it.href}
                            className="relative flex flex-col items-center justify-center gap-1 active:scale-90 transition-transform"
                        >
                            {active && (
                                <span className="absolute top-0 w-8 h-0.5 rounded-full bg-gradient-to-l from-emerald-500 to-teal-500" />
                            )}
                            <Icon
                                size={20}
                                className={active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}
                            />
                            <span className={`text-[10px] font-bold ${active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                {it.label}
                            </span>
                        </Link>
                    );
                })}
                <button
                    type="button"
                    onClick={onMore}
                    aria-label="المزيد من الأقسام"
                    className="flex flex-col items-center justify-center gap-1 active:scale-90 transition-transform text-slate-400 dark:text-slate-500"
                >
                    <Menu size={20} />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">المزيد</span>
                </button>
            </div>
        </nav>
    );
}
