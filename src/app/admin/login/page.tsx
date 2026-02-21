'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Loader2, ShieldCheck, AlertCircle, LogIn, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function AdminLoginPage() {
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
            console.error('Admin Login Error:', authError);
            setError(`بيانات الدخول غير صحيحة`);
            setLoading(false);
            return;
        }

        if (authData.user) {
            // Check Role strictly for Admin
            const { data: profile } = await supabase
                .from('member_profiles')
                .select('role')
                .eq('id', authData.user.id)
                .single();

            const role = profile?.role || 'member';

            if (role !== 'admin') {
                // Kick them out if not admin
                await supabase.auth.signOut();
                setError('عذراً، هذا الحساب لا يملك صلاحيات للوصول إلى لوحة الإدارة.');
                setLoading(false);
                return;
            }

            toast.success('تم تسجيل الدخول بنجاح للوحة الإدارة');
            router.push('/admin');
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 font-cairo" dir="rtl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.05)_0%,transparent_100%)] pointer-events-none" />

            <div className="max-w-md w-full relative z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-900 border border-slate-800 shadow-[0_0_30px_rgba(52,211,153,0.1)] mb-6 relative group">
                        <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Lock size={36} className="text-emerald-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">بوابة الإدارة</h1>
                    <p className="text-slate-400">منطقة مقيدة (للمسؤولين فقط)</p>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-800 p-8">
                    {error && (
                        <div className="mb-6 bg-red-950/50 border border-red-900/50 text-red-400 p-4 rounded-xl text-sm flex items-center gap-3">
                            <AlertCircle size={20} className="shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-slate-300">البريد الإلكتروني للإدارة</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-5 py-3.5 rounded-xl border border-slate-700 bg-slate-950/50 outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-white transition-all text-left ltr placeholder:text-slate-600"
                                    placeholder="admin@example.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-slate-300">كلمة المرور الإدارية</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-5 py-3.5 rounded-xl border border-slate-700 bg-slate-950/50 outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-white transition-all text-left ltr placeholder:text-slate-600"
                                placeholder="••••••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(5,150,105,0.2)] hover:shadow-[0_0_25px_rgba(5,150,105,0.4)] active:scale-[0.98] flex items-center justify-center gap-3 mt-6 border border-emerald-500/50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                            <span className="text-base">{loading ? 'جاري التحقق من الصلاحيات...' : 'تأكيد الدخول'}</span>
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs text-slate-600 font-medium mt-8 flex items-center justify-center gap-2">
                    <ShieldCheck size={14} /> كل العمليات محفوظة في سجل الإدارة
                </p>
            </div>
        </div>
    );
}
