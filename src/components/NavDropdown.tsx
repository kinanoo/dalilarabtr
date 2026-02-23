'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
    name: string;
    href: string;
    icon: LucideIcon;
}

interface NavDropdownProps {
    title: string;
    items: NavItem[];
    icon?: React.ReactNode;
}

export default function NavDropdown({ title, items, icon }: NavDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Check if any child is active
    const isChildActive = items.some(item => pathname === item.href);

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                type="button"
                aria-haspopup="true"
                aria-expanded={isOpen}
                onClick={() => setIsOpen(!isOpen)}
                className={`group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-bold transition-all duration-300 outline-none focus:ring-0 border-none ring-0
                    ${isChildActive || isOpen
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-gradient-to-tr hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-900/40 dark:hover:to-teal-900/40 hover:text-emerald-800 dark:hover:text-emerald-300 hover:shadow-lg hover:shadow-emerald-200/50 dark:hover:shadow-none hover:-translate-y-0.5'
                    }`}
            >
                {icon && <span className={isChildActive || isOpen ? 'text-emerald-500' : 'text-slate-400 group-hover:text-emerald-500 transition-colors'}>{icon}</span>}
                <span>{title}</span>
                <ChevronDown
                    className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180 text-emerald-500' : 'text-slate-400 group-hover:text-emerald-500'}`}
                    aria-hidden="true"
                />
            </button>

            {/* Standard Dropdown Panel - Enhanced Styling */}
            <div
                className={`absolute end-0 z-50 mt-4 w-60 origin-top-right rounded-2xl bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 border border-slate-100 dark:border-slate-800 transition-all duration-200 transform ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                    }`}
            >
                {/* Decoration Arrow */}
                <div className="absolute -top-2 right-6 w-4 h-4 bg-white dark:bg-slate-900 rotate-45 border-l border-t border-slate-100 dark:border-slate-800" />

                <div className="p-2 space-y-1 relative z-10">
                    {items.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={`
                                    group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200
                                    ${isActive
                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 shadow-sm'
                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }
                                    hover:shadow-[0_4px_12px_-2px_rgba(16,185,129,0.15)]
                                    relative overflow-hidden
                                `}
                            >
                                {/* Neon Glow Line (Bottom) - Expanding Right to Left */}
                                <span className="absolute bottom-0 right-0 h-[2px] w-0 bg-gradient-to-l from-emerald-400 to-emerald-600 shadow-[0_0_8px_rgba(52,211,153,0.8)] transition-all duration-300 ease-out group-hover:w-full" />

                                <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-emerald-100 dark:bg-emerald-800/30' : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700'}`}>
                                    <item.icon className={`h-4 w-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-emerald-500'}`} aria-hidden="true" />
                                </div>
                                <span className="relative z-10">{item.name}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
