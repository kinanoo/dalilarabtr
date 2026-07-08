'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MegaItem {
    name: string;
    href: string;
    icon: LucideIcon;
    desc?: string;
}

interface NavMegaMenuProps {
    title: string;
    items: readonly MegaItem[];
}

/**
 * Wide "mega-menu" dropdown for the desktop navbar — a 3-column grid of the
 * site's main sections, each with an icon chip, title and one-line hint.
 * The trigger is styled white-on-teal to sit on the teal header bar; the
 * panel drops below as a light card. Used for «الأقسام».
 */
export default function NavMegaMenu({ title, items }: NavMegaMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setIsOpen(false);
        }
        document.addEventListener('mousedown', onClickOutside);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onClickOutside);
            document.removeEventListener('keydown', onKey);
        };
    }, []);

    const isChildActive = items.some((i) => pathname === i.href);

    return (
        <div className="relative inline-block text-right" ref={ref}>
            <button
                type="button"
                aria-haspopup="true"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((v) => !v)}
                className={`group inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-bold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-white/50
                    ${isChildActive || isOpen
                        ? 'bg-white text-[hsl(200,45%,26%)] shadow-sm'
                        : 'text-white/90 hover:bg-white/15 hover:text-white'
                    }`}
            >
                <span>{title}</span>
                <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${isChildActive || isOpen ? 'text-[hsl(200,45%,26%)]' : 'text-white/70 group-hover:text-white'}`}
                    aria-hidden="true"
                />
            </button>

            {/* Panel — centered under the trigger, clamped to viewport width. */}
            <div
                className={`absolute top-full left-1/2 -translate-x-1/2 z-50 mt-3 w-[min(760px,92vw)] origin-top rounded-2xl bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 border border-slate-100 dark:border-slate-800 transition-all duration-200 ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none invisible'}`}
            >
                <div className="p-3">
                    <div className="px-2 pb-2 text-[11px] font-black tracking-wide text-[hsl(200,45%,32%)] dark:text-teal-300">
                        كل أقسام الموقع — نقرة واحدة للوصول
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                        {items.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`group/cell flex items-center gap-3 rounded-xl p-2.5 transition-colors ${isActive ? 'bg-[hsl(200,45%,95%)] dark:bg-slate-800' : 'hover:bg-[hsl(200,45%,96%)] dark:hover:bg-slate-800/70'}`}
                                >
                                    <span className={`shrink-0 flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${isActive ? 'bg-[hsl(200,42%,30%)] text-white' : 'bg-[hsl(200,40%,93%)] text-[hsl(200,45%,30%)] dark:bg-slate-800 dark:text-teal-300 group-hover/cell:bg-[hsl(200,42%,30%)] group-hover/cell:text-white'}`}>
                                        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-[13px] font-bold leading-tight text-slate-900 dark:text-slate-100 truncate">{item.name}</span>
                                        {item.desc && <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">{item.desc}</span>}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
