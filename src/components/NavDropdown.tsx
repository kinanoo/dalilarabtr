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
                onClick={() => setIsOpen(!isOpen)}
                className={`group inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold transition-all outline-none ${isChildActive || isOpen
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                    : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
            >
                {icon && <span className={isChildActive || isOpen ? 'text-emerald-500' : 'text-slate-400 group-hover:text-emerald-500 transition-colors'}>{icon}</span>}
                <span>{title}</span>
                <ChevronDown
                    className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180 text-emerald-500' : 'text-slate-400 group-hover:text-emerald-500'}`}
                    aria-hidden="true"
                />
            </button>

            {/* Standard Dropdown Panel */}
            <div
                className={`absolute end-0 z-50 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-xl bg-white dark:bg-slate-900 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-slate-100 dark:border-slate-800 transition-all duration-200 transform ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                    }`}
            >
                <div className="p-1.5 space-y-0.5">
                    {items.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={`${isActive ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    } group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm font-bold transition-colors`}
                            >
                                <item.icon className={`h-4 w-4 ${isActive ? 'text-emerald-500' : 'opacity-70'}`} aria-hidden="true" />
                                {item.name}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
