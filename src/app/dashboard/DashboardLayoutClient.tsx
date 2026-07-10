'use client';

import { useState, useEffect } from 'react';
import { getAuthClient, getClientUser } from '@/lib/supabaseClient';
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

    const supabase = getAuthClient();

    useEffect(() => {
        const checkUser = async () => {
            if (!supabase) { router.push('/login'); return; }

            const user = await getClientUser();
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
        if (!supabase) return;
        await supabase.auth.signOut();
        // signOut() only clears the Supabase auth cookies. Anything we wrote
        // ourselves to localStorage (anon_comment_id, visitor_id, draft
        // comments, last-visit timestamps, etc.) survives — that lets the
        // app re-identify the user across logouts. Wipe everything the app
        // owns so "log out" really means "log out".
        if (typeof window !== 'undefined') {
            try {
                ['anon_comment_id', 'visitor_id', 'admin_last_visit_ts',
                 'admin_activity_seen_ts',
                 'admin_lockout_until', 'admin_login_attempts']
                    .forEach((k) => localStorage.removeItem(k));
            } catch { /* localStorage may be disabled — non-fatal */ }
        }
        router.push('/login');
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo text-slate-900 dark:text-slate-100" dir="rtl">
            {/* Header — accent stripe + premium logo + nav */}
            <header className="relative bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm">
                {/* Top accent stripe — same family pattern as the public site */}
                <div
                    aria-hidden="true"
                    className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-l from-emerald-400 via-teal-400 to-cyan-400"
                />
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/dashboard" className="group flex items-center gap-2.5 hover:opacity-95 transition-opacity">
                        <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-black shadow-md shadow-emerald-500/30 group-hover:scale-105 group-hover:rotate-[-4deg] transition-all duration-300">
                            د
                        </div>
                        <div className="hidden sm:flex flex-col">
                            <span className="text-[9px] font-black tracking-[0.18em] uppercase text-emerald-600 dark:text-emerald-400 leading-none">DASHBOARD</span>
                            <span className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight">لوحة الأعضاء</span>
                        </div>
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
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-black transition-all duration-300 ${
                                        isActive
                                            ? 'bg-gradient-to-l from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 shadow-sm'
                                            : 'text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800'
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
