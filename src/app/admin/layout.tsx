'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';
import LoginPage from '@/components/admin/LoginPage';
import { ToastProvider } from '@/components/ui/Toast';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sidebarCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false); // Mobile Menu State

    useEffect(() => {
        if (!supabase) return;

        async function checkSession() {
            setLoading(true);
            const { data: { session } } = await supabase!.auth.getSession();
            if (session) {
                setIsAuthenticated(true);
            }
            setLoading(false);
        }

        checkSession();

        const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, session) => {
            setIsAuthenticated(!!session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase!.auth.signOut();
        setIsAuthenticated(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <LoginPage />;
    }

    return (
        <ToastProvider>
            <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
                <AdminSidebar
                    collapsed={sidebarCollapsed}
                    onLogout={handleLogout}
                    isOpen={isMobileOpen}
                    onClose={() => setIsMobileOpen(false)}
                />

                <main className="flex-1 transition-all duration-300 overflow-y-auto flex flex-col min-w-0">
                    {/* Mobile Header */}
                    <div className="lg:hidden p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">D</div>
                            <span className="font-bold text-slate-800 dark:text-white">دليلك (Admin)</span>
                        </div>
                        <button
                            onClick={() => setIsMobileOpen(true)}
                            className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 md:p-0">
                        {children}
                    </div>
                </main>
            </div>
        </ToastProvider>
    );
}
