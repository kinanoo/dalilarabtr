'use client';

import {
    LayoutDashboard,
    FileText,
    Briefcase,
    HelpCircle,
    ShieldAlert,
    Settings,
    Database,
    LogOut,
    Menu,
    Bell
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
    collapsed?: boolean;
    onLogout?: () => void;
    currentView?: string;
    setView?: (view: string) => void;
    isOpen?: boolean; // New prop for mobile
    onClose?: () => void; // New prop for mobile
}

export function AdminSidebar({ collapsed = false, onLogout, currentView, setView, isOpen = false, onClose }: SidebarProps) {
    const pathname = usePathname();

    // Define Menu Groups
    interface MenuItem {
        id?: string;
        href: string;
        label: string;
        icon: any;
        exact?: boolean;
    }

    const menuGroups: { title: string; items: MenuItem[] }[] = [
        {
            title: 'الرئيسية',
            items: [
                { href: '/admin', label: 'الرئيسية', icon: LayoutDashboard, exact: true }
            ]
        },
        {
            title: 'المحتوى',
            items: [
                { href: '/admin/services', label: 'الخدمات', icon: Briefcase },
                { href: '/admin/articles', label: 'المقالات', icon: FileText },
                { href: '/admin/updates', label: 'التحديثات', icon: Bell },
                { href: '/admin/banners', label: 'البنرات', icon: Menu },
            ]
        },
        {
            title: 'التفاعل',
            items: [
                { href: '/admin/faqs', label: 'الأسئلة الشائعة', icon: HelpCircle },
                { href: '/admin/scenarios', label: 'سيناريوهات المستشار', icon: HelpCircle }, // Added Scenarios
            ]
        },
        {
            title: 'النظام',
            items: [
                { href: '/admin/codes', label: 'أكواد أمنية', icon: ShieldAlert },
                { href: '/admin/zones', label: 'مناطق محظورة', icon: ShieldAlert },
                { href: '/admin/sources', label: 'مصادر رسمية', icon: Database },
                { href: '/admin/settings', label: 'الإعدادات', icon: Settings },
                { href: '/admin/migration', label: 'أدوات متقدمة', icon: Database },
            ]
        }
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 md:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={`
                fixed inset-y-0 right-0 z-40 bg-[#0f172a] text-slate-300 transition-transform duration-300 border-l border-white/5 shadow-2xl
                ${isOpen ? 'translate-x-0' : 'translate-x-full'} 
                md:relative md:translate-x-0 md:flex flex-col h-full
                ${collapsed ? 'md:w-20' : 'md:w-64'}
                w-72
            `}>
                {/* Close Button Mobile */}
                <div className="md:hidden absolute top-4 left-4 z-50">
                    {/* Can place close button here if needed, but overlay click is enough */}
                </div>

                {/* Header / Logo */}
                {/* ... existing header code ... */}
                <div className="p-6 flex items-center justify-between border-b border-white/5 h-20">
                    {!collapsed ? (
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/20">D</div>
                            <div>
                                <h1 className="font-bold text-white text-lg tracking-tight">لوحة التحكم</h1>
                                <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">v2.1.0 High Density</p>
                            </div>
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold mx-auto">D</div>
                    )}
                    {/* Mobile Close Icon */}
                    <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:text-white">
                        <Menu size={20} />
                    </button>
                </div>

                {/* ... Rest of nav ... */}

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar space-y-8">
                    {menuGroups.map((group, idx) => (
                        <div key={idx}>
                            {!collapsed && (
                                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">
                                    {group.title}
                                </h3>
                            )}
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    // Logic: If setView is provided, use currentView for active state.
                                    // Otherwise, use pathname.
                                    let isActive = false;
                                    if (setView && currentView) {
                                        const viewName = item.href === '/admin' ? 'dashboard' : item.href.split('/').pop() || '';
                                        isActive = currentView === viewName;
                                    } else {
                                        isActive = item.exact
                                            ? pathname === item.href
                                            : pathname.startsWith(item.href);
                                    }

                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={(e) => {
                                                if (setView) {
                                                    e.preventDefault();
                                                    const viewName = item.href === '/admin' ? 'dashboard' : item.href.split('/').pop() || 'dashboard';
                                                    setView(viewName);
                                                }
                                            }}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive
                                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 font-bold'
                                                : 'hover:bg-white/5 text-slate-400 hover:text-white'
                                                }`}
                                        >
                                            <Icon size={18} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-white transition-colors'} />
                                            {!collapsed && <span>{item.label}</span>}
                                            {isActive && !collapsed && (
                                                <div className="mr-auto w-1.5 h-1.5 rounded-full bg-white/50" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Footer / Logout */}
                <div className="p-4 border-t border-white/5 bg-[#0b1120]">
                    {onLogout && (
                        <button
                            onClick={onLogout}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-red-400 hover:bg-red-500/10 hover:text-red-300 ${collapsed ? 'justify-center' : ''}`}
                        >
                            <LogOut size={18} />
                            {!collapsed && <span className="font-bold text-sm">تسجيل خروج</span>}
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
}
