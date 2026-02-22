'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Loader2, Lock, ShieldCheck, AlertCircle, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase as supabaseAdmin } from '@/lib/supabaseClient'; // Optional fallback import
import { toast } from 'sonner';
import Link from 'next/link';
import type { Metadata } from 'next';

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
            console.error('Login Error:', authError);
            setError(`البريد الإلكتروني أو كلمة المرور غير صحيحة (${authError.message})`);
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
                await supabase.auth.signOut();
                setError('هذا الحساب إداري. الرجاء تسجيل الدخول من بوابة الإدارة المخصصة.');
                setLoading(false);
                return;
            }

            toast.success('تم تسجيل الدخول بنجاح');
            router.push('/dashboard');
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 font-cairo py-12" dir="rtl">
            <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">

                {/* Advantages Section - Left Side on Desktop */}
                <div className="bg-slate-900 p-8 md:p-12 text-white relative flex flex-col justify-center order-2 md:order-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-blue-600/20 opacity-50" />
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />

                    <div className="relative z-10">
                        <h2 className="text-3xl font-black mb-6 leading-tight">مزايا العودة للمنصة</h2>
                        <ul className="space-y-6">
                            {[
                                { icon: <ShieldCheck size={24} className="text-emerald-400" />, title: 'أمان وخصوصية تامة', desc: 'جميع بياناتك واستشاراتك محفوظة بأعلى معايير التشفير.' },
                                { icon: <AlertCircle size={24} className="text-amber-400" />, title: 'إشعارات حصرية', desc: 'تلقَ تنبيهات بأحدث القوانين، الأخبار، والتغييرات التي تهمك.' },
                                { icon: <LogIn size={24} className="text-blue-400" />, title: 'تواصل سريع ومباشر', desc: 'ردود أسرع على استشاراتك وسهولة في التواصل مع الخبراء.' },
                            ].map((item, idx) => (
                                <li key={idx} className="flex items-start gap-4">
                                    <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm shrink-0">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                                        <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Form Section - Right Side on Desktop */}
                <div className="p-8 md:p-12 order-1 md:order-2 flex flex-col justify-center">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">تسجيل الدخول</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">أهلاً بك مجدداً في عائلة دليل العرب</p>
                    </div>

                    {/* Google Login (UI Only) */}
                    <button
                        type="button"
                        className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold py-3.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all mb-6 shadow-sm"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        الاستمرار باستخدام Google
                    </button>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
                        <span className="text-xs text-slate-400 font-bold">أو بالطريقة التقليدية</span>
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
                    </div>

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
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-left ltr font-medium"
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
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-left ltr font-medium"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl transition-all shadow-xl shadow-emerald-600/30 active:scale-95 flex items-center justify-center gap-2 mt-4 text-lg"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <LogIn size={24} />}
                            {loading ? 'جاري التحقق...' : 'دخول'}
                        </button>
                    </form>

                    <div className="text-center mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-sm text-slate-500">
                            ليس لديك حساب؟{' '}
                            <Link href="/join" className="text-emerald-600 font-bold hover:underline transition-all">
                                انضم إلينا الآن
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
