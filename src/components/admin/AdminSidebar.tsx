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
    Bell,
    Star,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
    BrainCircuit,
    ShieldCheck,
    Megaphone,
    Newspaper,
    Users
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface SidebarProps {
    collapsed?: boolean;
    onToggle?: () => void;
    onLogout?: () => void;
    currentView?: string;
    setView?: (view: string) => void;
    isOpen?: boolean;
    onClose?: () => void;
}

export function AdminSidebar({ collapsed = false, onToggle, onLogout, currentView, setView, isOpen = false, onClose }: SidebarProps) {
    const pathname = usePathname();
    const [badges, setBadges] = useState<Record<string, number>>({});

    useEffect(() => {
        const fetchBadges = async () => {
            if (!supabase) return;
            const [services, articles, comments] = await Promise.all([
                supabase.from('service_providers').select('id', { count: 'exact' }).eq('status', 'pending'),
                supabase.from('articles').select('id', { count: 'exact' }).eq('status', 'pending'),
                supabase.from('comments').select('id', { count: 'exact' }).eq('status', 'pending'),
            ]);
            const requestsCount = (services.count || 0) + (articles.count || 0);
            const commentsCount = comments.count || 0;
            setBadges({
                '/admin/requests': requestsCount,
                '/admin/community': commentsCount,
            });
        };
        fetchBadges();
        // Refresh every 30 seconds
        const interval = setInterval(fetchBadges, 30_000);
        return () => clearInterval(interval);
    }, []);

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
                { href: '/admin/requests', label: 'طلبات الانضمام', icon: Bell },
                { href: '/admin/services', label: 'الخدمات', icon: Briefcase },
                { href: '/admin/articles', label: 'المقالات', icon: FileText },
                { href: '/admin/updates', label: 'التحديثات', icon: Megaphone }, // Changed Bell to Megaphone to avoid dup
            ]
        },
        {
            title: 'التفاعل',
            items: [
                { href: '/admin/members', label: 'الأعضاء', icon: Users },
                { href: '/admin/faqs', label: 'الأسئلة الشائعة', icon: HelpCircle },
                { href: '/admin/reviews', label: 'التقييمات', icon: Star },
                { href: '/admin/community', label: 'المجتمع', icon: MessageSquare },
                { href: '/admin/scenarios', label: 'سيناريوهات المستشار', icon: BrainCircuit },
            ]
        },
        {
            title: 'النظام',
            items: [
                { href: '/admin/analyst', label: 'المحلل الاستراتيجي', icon: BrainCircuit },
                { href: '/admin/integrity', label: 'فحص النظام', icon: ShieldCheck },
                { href: '/admin/banners', label: 'البنرات والتنبيهات', icon: Megaphone },
                { href: '/admin/news-ticker', label: 'شريط الأخبار', icon: Newspaper },
                { href: '/admin/codes', label: 'أكواد أمنية', icon: ShieldAlert },
                { href: '/admin/zones', label: 'مناطق محظورة', icon: ShieldAlert },
                { href: '/admin/sources', label: 'مصادر رسمية', icon: Database },
                { href: '/admin/settings', label: 'الإعدادات', icon: Settings },
            ]
        }
    ];

    return (
        <>
            {/* Mobile Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm xl:hidden"
                        onClick={onClose}
                    >
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="absolute inset-y-0 right-0 w-72 bg-white dark:bg-slate-950 shadow-2xl overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Drawer Header */}
                            <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50">
                                <div className="flex items-center gap-2">
                                    <Image src="/logo.png" alt="Dalil" width={28} height={28} className="rounded-lg" />
                                    <span className="font-bold text-sm text-slate-800 dark:text-white">لوحة التحكم</span>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 text-slate-400 hover:text-red-500 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>

                            {/* Drawer Navigation */}
                            <div className="px-3 py-3 space-y-4">
                                {menuGroups.map((group, idx) => (
                                    <div key={idx}>
                                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-2">
                                            {group.title}
                                        </h3>
                                        <div className="space-y-0.5">
                                            {group.items.map((item) => {
                                                let isActive = false;
                                                if (setView && currentView) {
                                                    const viewName = item.href === '/admin' ? 'dashboard' : item.href.split('/').pop() || '';
                                                    isActive = currentView === viewName;
                                                } else {
                                                    isActive = item.exact
                                                        ? pathname === item.href
                                                        : pathname === item.href || pathname.startsWith(`${item.href}/`);
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
                                                            onClose?.();
                                                        }}
                                                        className={`
                                                            flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-sm
                                                            ${isActive
                                                                ? 'bg-emerald-600 text-white font-bold'
                                                                : 'hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300'
                                                            }
                                                        `}
                                                    >
                                                        <span className="relative shrink-0">
                                                            <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                                                            {badges[item.href] > 0 && (
                                                                <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center leading-none">
                                                                    {badges[item.href] > 99 ? '99+' : badges[item.href]}
                                                                </span>
                                                            )}
                                                        </span>
                                                        <span className="flex-1">{item.label}</span>
                                                        {badges[item.href] > 0 && !isActive && (
                                                            <span className="min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                                                {badges[item.href]}
                                                            </span>
                                                        )}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Drawer Footer */}
                            <div className="px-3 py-3 mt-2 border-t border-slate-100 dark:border-slate-800/50 pb-safe">
                                {onLogout && (
                                    <button
                                        onClick={onLogout}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 font-bold hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                    >
                                        <LogOut size={16} />
                                        تسجيل خروج
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar (unchanged mainly, just hidden on mobile now) */}
            <aside className={`
                hidden xl:flex flex-col h-full bg-[#0f172a] text-slate-300 transition-all duration-300 border-l border-white/5 shadow-2xl relative
                ${collapsed ? 'w-20' : 'w-72'}
            `}>
                {/* Header / Logo */}
                <div className={`p-4 flex items-center ${collapsed ? 'justify-center' : 'justify-between'} border-b border-white/5 h-20`}>
                    {!collapsed && (
                        <Link href="/admin" className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
                            <div className="w-10 h-10 rounded-xl bg-white/5 p-1.5 flex items-center justify-center border border-white/10 shadow-lg group-hover:border-emerald-500/30 transition-colors">
                                <Image src="/logo.png" alt="Dalil" width={40} height={40} className="w-full h-full object-contain" />
                            </div>
                            <div className="overflow-hidden whitespace-nowrap">
                                <h1 className="font-bold text-white text-lg tracking-tight group-hover:text-emerald-400 transition-colors">لوحة التحكم</h1>
                                <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">v2.1.0 Pro</p>
                            </div>
                        </Link>
                    )}

                    {collapsed && (
                        <Link href="/admin" className="w-10 h-10 rounded-xl bg-white/5 p-1.5 flex items-center justify-center border border-white/10 hover:border-emerald-500/30 transition-colors" title="الرئيسية">
                            <Image src="/logo.png" alt="Dalil" width={40} height={40} className="w-full h-full object-contain" />
                        </Link>
                    )}

                    {/* Toggle Button */}
                    <button
                        onClick={onToggle}
                        className="flex w-8 h-8 items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                        title={collapsed ? "توسيع القائمة" : "تصغير القائمة"}
                    >
                        {collapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                    </button>
                </div>

                {/* Desktop Navigation */}
                <nav className="flex-1 px-3 py-6 overflow-y-auto space-y-8 custom-scrollbar">
                    {menuGroups.map((group, idx) => (
                        <div key={idx} className={collapsed ? 'px-0 text-center' : ''}>
                            {!collapsed && (
                                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-2 fade-in">
                                    {group.title}
                                </h3>
                            )}
                            {collapsed && idx > 0 && <div className="h-px bg-white/5 my-4 mx-2" />}

                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    let isActive = false;
                                    if (setView && currentView) {
                                        const viewName = item.href === '/admin' ? 'dashboard' : item.href.split('/').pop() || '';
                                        isActive = currentView === viewName;
                                    } else {
                                        isActive = item.exact
                                            ? pathname === item.href
                                            : pathname === item.href || pathname.startsWith(`${item.href}/`);
                                    }

                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            title={collapsed ? item.label : ''}
                                            onClick={(e) => {
                                                if (setView) {
                                                    e.preventDefault();
                                                    const viewName = item.href === '/admin' ? 'dashboard' : item.href.split('/').pop() || 'dashboard';
                                                    setView(viewName);
                                                }
                                            }}
                                            className={`
                                                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative
                                                ${isActive
                                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 font-bold'
                                                    : 'hover:bg-white/5 text-slate-400 hover:text-white'
                                                }
                                                ${collapsed ? 'justify-center w-full px-0' : 'w-full'}
                                            `}
                                        >
                                            <span className="relative">
                                                <Icon size={collapsed ? 24 : 18} className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white transition-colors'}`} />
                                                {badges[item.href] > 0 && (
                                                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                                                        {badges[item.href] > 99 ? '99+' : badges[item.href]}
                                                    </span>
                                                )}
                                            </span>

                                            {!collapsed && (
                                                <span className="truncate flex-1">{item.label}</span>
                                            )}

                                            {!collapsed && badges[item.href] > 0 && !isActive && (
                                                <span className="mr-auto min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                                    {badges[item.href] > 99 ? '99+' : badges[item.href]}
                                                </span>
                                            )}

                                            {isActive && !collapsed && badges[item.href] === 0 && (
                                                <div className="mr-auto w-1.5 h-1.5 rounded-full bg-white/50" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-[#0b1120]">
                    {onLogout && (
                        <button
                            onClick={onLogout}
                            title={collapsed ? "تسجيل خروج" : ""}
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
