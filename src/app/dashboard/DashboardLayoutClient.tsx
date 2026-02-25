'use client';

import { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Loader2, LogOut, User, Home, UserCircle, Activity } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface UserProfile {
    full_name: string;
    role: string;
}

export default function DashboardLayoutClient({
    children,
}: {
    children: React.ReactNode;
}) {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    const supabase = useMemo(() => createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ), []);

    useEffect(() => {
        const checkUser = async () => {
            // Development Member Bypass Check
            if (process.env.NODE_ENV === 'development' && document.cookie.includes('dev_member_bypass=true')) {
                setProfile({ full_name: 'عضو تجريبي', role: 'member' });
                setLoading(false);
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data } = await supabase
                .from('member_profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            setProfile(data || { full_name: user?.user_metadata?.full_name || 'عضو', role: 'member' });
            setLoading(false);
        };

        checkUser();
    }, [router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo text-slate-900 dark:text-slate-100" dir="rtl">
            {/* Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
                            د
                        </div>
                        <span className="font-bold text-lg hidden sm:inline">لوحة الأعضاء</span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-1">
                        {[
                            { href: '/dashboard', label: 'الرئيسية', icon: Home },
                            { href: '/dashboard/profile', label: 'الملف الشخصي', icon: UserCircle },
                            { href: '/dashboard/activity', label: 'نشاطي', icon: Activity },
                        ].map((link) => {
                            const Icon = link.icon;
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                                        isActive
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <Icon size={16} />
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-slate-800 py-1.5 px-3 rounded-full">
                            <User size={16} className="text-slate-400" />
                            <span className="font-bold">{profile?.full_name}</span>
                            <span className="text-xs text-slate-400 border-r border-slate-300 dark:border-slate-600 pr-2 mr-2">
                                {profile?.role === 'admin' ? 'مدير' : 'عضو'}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="bg-red-50 dark:bg-red-900/10 text-red-600 hover:bg-red-100 p-2 rounded-lg transition-colors"
                            title="تسجيل خروج"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>

                {/* Mobile Nav */}
                <div className="md:hidden border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
                    <div className="flex items-center gap-1 px-4 py-2 min-w-max">
                        {[
                            { href: '/dashboard', label: 'الرئيسية', icon: Home },
                            { href: '/dashboard/profile', label: 'الملف الشخصي', icon: UserCircle },
                            { href: '/dashboard/activity', label: 'نشاطي', icon: Activity },
                        ].map((link) => {
                            const Icon = link.icon;
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                                        isActive
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                    }`}
                                >
                                    <Icon size={14} />
                                    {link.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8 max-w-5xl">
                {children}
            </main>
        </div>
    );
}
