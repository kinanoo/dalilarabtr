'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';
import LoginPage from '@/components/admin/LoginPage';
import { ToastProvider } from '@/components/ui/Toast';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

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
            <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
                <AdminSidebar />
                <main className="flex-1 lg:mr-64 transition-all duration-300">
                    <div className="p-6 md:p-8 max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </ToastProvider>
    );
}
