'use client';

import { useState } from 'react';
import { getAuthClient } from '@/lib/supabaseClient';
import { Loader2, UserPlus, Mail, Lock, User, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import PageHero from '@/components/PageHero';

export default function JoinPage() {
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const supabase = getAuthClient();

    const handleGoogleLogin = () => {
        window.location.href = '/api/auth/google?next=/dashboard';
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase) return;
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
            setSuccess(true);
            setLoading(false);

            // If they are immediately logged in (Confirm Email is OFF in Supabase)
            if (authData.session) {
                setTimeout(() => {
                    router.push('/dashboard');
                }, 1500);
            }
            // If session is null (Confirm Email is ON), they stay on this success screen.
            return;
        }
        setLoading(false);
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 font-cairo p-4" dir="rtl">
                <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in zoom-in max-w-md w-full">
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Mail size={40} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">يرجى تأكيد بريدك الإلكتروني!</h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed text-sm">
                        قمنا للتو بإرسال رابط التفعيل إلى بريدك الإلكتروني لمعاينة الحساب: <br />
                        <strong className="text-emerald-600 dark:text-emerald-400 block mt-2 text-base">{email}</strong><br />
                        يرجى تفقد صندوق الوارد (أو مجلد الرسائل المزعجة Spam) والنقر على الرابط لتفعيل حسابك، ثم تسجيل الدخول.
                    </p>
                    <Link href="/login" className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3.5 rounded-xl transition-colors shadow-md shadow-emerald-600/20 w-full sm:w-auto">
                        الذهاب لصفحة الدخول
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo" dir="rtl">
            <PageHero
                title="إنشاء حساب جديد"
                description="انضم الآن لعائلة دليل العرب"
                icon={<UserPlus size={32} />}
            />

            <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

                {/* Form Section */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8">
                    {/* Google Login */}
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold py-3.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors mb-6 shadow-sm"
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
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">أو بالطريقة التقليدية</span>
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
                    </div>

                    <form onSubmit={handleRegister} method="POST" className="space-y-5">
                        <div>
                            <label htmlFor="join-name" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">الاسم الكامل</label>
                            <div className="relative">
                                <User className="absolute top-3.5 start-4 text-slate-400" size={18} />
                                <input
                                    id="join-name"
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full ps-11 pe-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium"
                                    placeholder="مثال: أحمد محمد"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="join-email" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">البريد الإلكتروني</label>
                            <div className="relative">
                                <Mail className="absolute top-3.5 start-4 text-slate-400" size={18} />
                                <input
                                    id="join-email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full ps-11 pe-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-left ltr font-medium"
                                    placeholder="name@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="join-password" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">كلمة المرور</label>
                            <div className="relative">
                                <Lock className="absolute top-3.5 start-4 text-slate-400" size={18} />
                                <input
                                    id="join-password"
                                    type="password"
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full ps-11 pe-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-left ltr font-medium"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-black py-4 rounded-xl transition-colors shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 mt-4 text-lg"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <UserPlus size={24} />}
                            انضم إلينا الآن
                        </button>

                        <div className="text-center mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                لديك حساب بالفعل؟{' '}
                                <Link href="/login" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline transition-colors">
                                    سجل دخولك
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>

                {/* Advantages Section */}
                <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white mb-4">لماذا ينبغي عليك الانضمام؟</h2>
                    <ul className="space-y-4">
                        {[
                            { icon: <UserPlus size={22} />, title: 'مشاركة خدماتك ورؤيتك', desc: 'أضف خدماتك المهنية ليصل إليها آلاف العملاء يومياً.' },
                            { icon: <Lock size={22} />, title: 'حفظ الاستشارات', desc: 'استشر الذكاء الاصطناعي واحتفظ بجميع استشاراتك للرجوع لها لاحقاً.' },
                            { icon: <CheckCircle size={22} />, title: 'أدوات ذكية حصرية', desc: 'استخدم أدوات حساب الضرائب وتكاليف المعيشة مجاناً.' },
                        ].map((item, idx) => (
                            <li
                                key={idx}
                                className="flex items-start gap-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 transition-all hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md hover:-translate-y-0.5"
                            >
                                <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-3 rounded-2xl shrink-0">
                                    {item.icon}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">{item.title}</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
