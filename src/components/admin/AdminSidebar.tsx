'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Files,
    MessageSquare,
    Bell,
    Settings,
    LogOut,
    Users,
    Database
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const MENU_ITEMS = [
    { name: 'الرئيسية', href: '/admin', icon: LayoutDashboard },
    { name: 'المصادر', href: '/admin/sources', icon: Database },
    { name: 'المقالات', href: '/admin/articles', icon: Files },
    { name: 'الاقتراحات', href: '/admin/suggestions', icon: MessageSquare },
    { name: 'التحديثات', href: '/admin/updates', icon: Bell },
    { name: 'المستخدمين', href: '/admin/users', icon: Users },
    { name: 'الإعدادات', href: '/admin/settings', icon: Settings },
];

export default function AdminSidebar() {
    const pathname = usePathname();

    const handleLogout = async () => {
        await supabase?.auth.signOut();
        window.location.href = '/login';
    };

    return (
        <aside className="w-64 bg-slate-900 border-l border-slate-800 hidden lg:flex flex-col fixed inset-y-0 right-0 z-50">
            <div className="p-6 border-b border-slate-800">
                <h1 className="text-xl font-bold text-white">لوحة التحكم</h1>
                <p className="text-xs text-slate-400 mt-1">إدارة دليل العرب</p>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {MENU_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <item.icon size={20} />
                            <span className="font-bold text-sm">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-900/10 hover:text-red-300 rounded-xl transition-all"
                >
                    <LogOut size={20} />
                    <span className="font-bold text-sm">تسجيل خروج</span>
                </button>
            </div>
        </aside>
    );
}
