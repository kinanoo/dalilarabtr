'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Loader2, UserPlus, Mail, Lock, User, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function JoinPage() {
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // 1. Sign Up
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });

        if (authError) {
            toast.error(authError.message);
            setLoading(false);
            return;
        }

        if (authData.user) {
            // 2. Create Profile (Trigger usually handles this, but we can do it manually to be safe or if no trigger exists)
            // We'll rely on our 'member_profiles' table. 
            // If we didn't set up a Trigger in SQL, we must insert here.
            // Let's try to insert. If RLS allows insert own profile.
            const { error: profileError } = await supabase
                .from('member_profiles')
                .insert([
                    {
                        id: authData.user.id,
                        full_name: fullName,
                        role: 'member'
                    }
                ]);

            if (profileError) {
                // If error is duplicate key, it means trigger already did it. Ignore.
                if (profileError.code !== '23505') {
                    console.error('Profile creation failed:', profileError);
                    // Don't block flow, just warn
                }
            }

            setSuccess(true);
            setTimeout(() => {
                router.push('/dashboard');
            }, 1000);
        }
        setLoading(false);
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 font-cairo">
                <div className="text-center p-10 bg-white dark:bg-slate-900 rounded-2xl shadow-xl animate-in fade-in zoom-in">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={40} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">تم إنشاء الحساب بنجاح!</h1>
                    <p className="text-slate-500">جاري تحويلك إلى لوحة التحكم...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 font-cairo py-12" dir="rtl">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                {/* Header */}
                <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-600/10 opacity-50" />
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="bg-white/10 p-4 rounded-2xl mb-4 backdrop-blur-sm">
                            <UserPlus size={48} className="text-blue-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-1">انضم لعائلة دليل العرب</h1>
                        <p className="text-slate-400 text-sm">أنشئ حساباً وشارك خدماتك وأفكارك مع الجميع</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleRegister} className="p-8 space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">الاسم الكامل</label>
                        <div className="relative">
                            <User className="absolute top-3.5 right-4 text-slate-400" size={18} />
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full pr-11 pl-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                placeholder="مثال: أحمد محمد"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">البريد الإلكتروني</label>
                        <div className="relative">
                            <Mail className="absolute top-3.5 right-4 text-slate-400" size={18} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pr-11 pl-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-left ltr"
                                placeholder="name@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">كلمة المرور</label>
                        <div className="relative">
                            <Lock className="absolute top-3.5 right-4 text-slate-400" size={18} />
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pr-11 pl-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-left ltr"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <UserPlus size={20} />}
                        إنشاء حساب جديد
                    </button>

                    <div className="text-center mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-sm text-slate-500">
                            لديك حساب بالفعل؟{' '}
                            <Link href="/login" className="text-blue-600 font-bold hover:underline">
                                سجل دخولك
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
