'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Loader2, Lock, ShieldCheck, AlertCircle, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const SITE_CONFIG = {
    name: 'Daleel Arab Turkiye'
};

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
            setLoading(false);
            return;
        }

        if (authData.user) {
            // Check Role
            const { data: profile } = await supabase
                .from('member_profiles')
                .select('role')
                .eq('id', authData.user.id)
                .single();

            const role = profile?.role || 'member';

            if (role === 'admin') {
                router.push('/admin');
            } else {
                router.push('/dashboard');
            }
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 px-4 font-cairo" dir="rtl">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">

                {/* Header */}
                <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-emerald-600/10 opacity-50" />
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="bg-white/10 p-4 rounded-2xl mb-4 backdrop-blur-sm">
                            <ShieldCheck size={48} className="text-emerald-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-1">تسجيل الدخول</h1>
                        <p className="text-slate-400 text-sm">أهلاً بك مجدداً في عائلة دليل العرب</p>
                    </div>
                </div>

                {/* Form */}
                <div className="p-8">
                    {error && (
                        <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 p-3 rounded-lg text-sm flex items-center gap-2">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">البريد الإلكتروني</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-left ltr"
                                placeholder="name@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">كلمة المرور</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-left ltr"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <LogIn size={20} />}
                            تسجيل الدخول
                        </button>
                    </form>

                    <div className="text-center mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-sm text-slate-500">
                            ليس لديك حساب؟{' '}
                            <Link href="/join" className="text-emerald-600 font-bold hover:underline">
                                انضم إلينا الآن
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
