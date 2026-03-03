'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { ToastProvider } from '@/components/ui/Toast';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminActivityBell } from '@/components/admin/AdminActivityBell';
import { ActiveVisitorsBell } from '@/components/admin/ActiveVisitorsBell';
import { Loader2, ShieldAlert } from 'lucide-react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();

    // All hooks must be declared before any conditional return (Rules of Hooks)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // ─── Auth Guard State ───────────────────────────────────────────────
    const [authState, setAuthState] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');

    // ─── Auth Guard: verify admin role on mount ─────────────────────────
    useEffect(() => {
        // Login page doesn't need auth check
        if (pathname === '/admin/login') {
            setAuthState('authorized');
            return;
        }

        let cancelled = false;

        async function verifyAdmin() {
            try {
                const res = await fetch('/api/admin/verify');
                if (cancelled) return;

                if (res.ok) {
                    setAuthState('authorized');
                } else {
                    // Not admin or not authenticated → redirect to login
                    setAuthState('unauthorized');
                    router.replace('/admin/login');
                }
            } catch {
                if (cancelled) return;
                setAuthState('unauthorized');
                router.replace('/admin/login');
            }
        }

        verifyAdmin();
        return () => { cancelled = true; };
    }, [pathname, router]);

    useEffect(() => {
        // Skip on login page (no sidebar to restore)
        if (pathname === '/admin/login') return;
        const savedState = localStorage.getItem('admin_sidebar_collapsed');
        if (savedState) setSidebarCollapsed(savedState === 'true');
    }, [pathname]);

    const handleSidebarToggle = () => {
        const newState = !sidebarCollapsed;
        setSidebarCollapsed(newState);
        localStorage.setItem('admin_sidebar_collapsed', String(newState));
    };

    const handleLogout = async () => {
        try {
            // Server-side signout ensures HTTP-only cookies are properly cleared
            await fetch('/api/auth/signout', { method: 'POST' });
        } catch (e) {
            console.error('Logout error:', e);
        }
        window.location.href = '/admin/login';
    };

    // ─── Login page: bare render — NO sidebar, NO header, NO nav links ───────
    if (pathname === '/admin/login') {
        return <ToastProvider>{children}</ToastProvider>;
    }

    // ─── Auth Guard: show loading screen while verifying ─────────────────
    if (authState === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950" dir="rtl">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800">
                        <Loader2 size={32} className="text-emerald-500 animate-spin" />
                    </div>
                    <p className="text-slate-400 font-medium">جاري التحقق من الصلاحيات...</p>
                </div>
            </div>
        );
    }

    // ─── Auth Guard: blocked — show nothing (redirect is in progress) ────
    if (authState === 'unauthorized') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950" dir="rtl">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-950/50 border border-red-900/50">
                        <ShieldAlert size={32} className="text-red-500" />
                    </div>
                    <p className="text-red-400 font-medium">غير مصرح بالدخول</p>
                    <p className="text-slate-500 text-sm">جاري إعادة التوجيه...</p>
                </div>
            </div>
        );
    }

    return (
        <ToastProvider>
            <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
                <AdminSidebar
                    collapsed={sidebarCollapsed}
                    onToggle={handleSidebarToggle}
                    onLogout={handleLogout}
                    isOpen={isMobileOpen}
                    onClose={() => setIsMobileOpen(false)}
                />

                <main className="flex-1 transition-all duration-300 overflow-y-auto flex flex-col min-w-0 pt-14 xl:pt-0">
                    {/* Mobile Header (Slim & Compact) */}
                    <div className="xl:hidden fixed top-0 left-0 right-0 z-[60] bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-between transition-all shadow-sm h-12">
                        <Link href="/admin" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                            <div className="w-7 h-7 bg-white dark:bg-slate-800 rounded-md p-1 shadow-sm border border-slate-200 dark:border-slate-700">
                                <Image src="/logo.png" alt="دليل العرب" width={28} height={28} className="w-full h-full object-contain" />
                            </div>
                            <h1 className="font-bold text-slate-800 dark:text-white text-sm">لوحة التحكم</h1>
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 [&_button]:bg-slate-100 [&_button]:dark:bg-slate-800 [&_button]:text-slate-600 [&_button]:dark:text-slate-300">
                                <ActiveVisitorsBell />
                                <AdminActivityBell />
                            </div>
                            <button
                                type="button"
                                aria-label="فتح القائمة"
                                onClick={() => setIsMobileOpen(true)}
                                className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-95 transition-transform"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 md:p-0">
                        {children}
                    </div>
                </main>
            </div>
        </ToastProvider>
    );
}
