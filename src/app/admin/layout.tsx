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
                />
                <main className="flex-1 transition-all duration-300 overflow-y-auto">
                    {children}
                </main>
            </div>
        </ToastProvider>
    );
}
