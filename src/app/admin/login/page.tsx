'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, ShieldCheck, AlertCircle, Lock, Timer } from 'lucide-react';
import { useRouter } from 'next/navigation';

const GENERIC_ERROR = 'بيانات الدخول غير صحيحة';
const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 60;

export default function AdminLoginPage() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Client-side lockout state (UX layer — real enforcement is server-side)
    const [attempts, setAttempts] = useState(() => {
        try { return parseInt(localStorage.getItem('admin_login_attempts') || '0'); } catch { return 0; }
    });
    const [lockoutRemaining, setLockoutRemaining] = useState(() => {
        try {
            const until = parseInt(localStorage.getItem('admin_lockout_until') || '0');
            const remaining = Math.max(0, Math.ceil((until - Date.now()) / 1000));
            return remaining;
        } catch { return 0; }
    });
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const router = useRouter();

    // Persist attempts to localStorage
    useEffect(() => {
        try { localStorage.setItem('admin_login_attempts', String(attempts)); } catch {}
    }, [attempts]);

    // Countdown timer during lockout
    useEffect(() => {
        if (lockoutRemaining <= 0) return;
        timerRef.current = setInterval(() => {
            setLockoutRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    setAttempts(0);
                    try { localStorage.removeItem('admin_login_attempts'); localStorage.removeItem('admin_lockout_until'); } catch {}
                    setError('');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current!);
    }, [lockoutRemaining]);

    const isLocked = lockoutRemaining > 0;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLocked || loading) return;

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/admin-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                // Success — session cookies set by the server
                setAttempts(0);
                try {
                    localStorage.removeItem('admin_login_attempts');
                    localStorage.removeItem('admin_lockout_until');
                } catch {}
                router.push('/admin');
                router.refresh();
                return;
            }

            if (res.status === 429) {
                // Server-side rate limited
                const lockoutSec = (data.lockout_minutes || 15) * 60;
                setError(`تم تجاوز الحد الأقصى للمحاولات. يُرجى الانتظار.`);
                try { localStorage.setItem('admin_lockout_until', String(Date.now() + lockoutSec * 1000)); } catch {}
                setLockoutRemaining(lockoutSec);
                setAttempts(MAX_ATTEMPTS);
            } else {
                // Invalid credentials — use server's remaining count if available
                const remaining = typeof data.remaining === 'number' ? data.remaining : (MAX_ATTEMPTS - attempts - 1);
                const newAttempts = MAX_ATTEMPTS - remaining;
                setAttempts(newAttempts);

                if (remaining <= 0) {
                    setError(`تم تجاوز الحد الأقصى للمحاولات. يُرجى الانتظار ${LOCKOUT_SECONDS} ثانية.`);
                    try { localStorage.setItem('admin_lockout_until', String(Date.now() + LOCKOUT_SECONDS * 1000)); } catch {}
                    setLockoutRemaining(LOCKOUT_SECONDS);
                } else {
                    setError(`${GENERIC_ERROR} (${newAttempts}/${MAX_ATTEMPTS})`);
                }
            }
        } catch {
            setError('حدث خطأ في الاتصال بالخادم. يرجى المحاولة لاحقاً.');
        } finally {
            setLoading(false);
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

                    {/* Lockout Banner */}
                    {isLocked && (
                        <div className="mb-6 bg-amber-950/50 border border-amber-900/50 text-amber-400 p-4 rounded-xl text-sm flex items-center gap-3">
                            <Timer size={20} className="shrink-0 animate-pulse" />
                            <span>
                                تم إيقاف الدخول مؤقتاً. إعادة المحاولة بعد{' '}
                                <strong className="text-amber-300 font-mono">
                                    {lockoutRemaining >= 60
                                        ? `${Math.ceil(lockoutRemaining / 60)} دقائق`
                                        : `${lockoutRemaining} ثانية`
                                    }
                                </strong>
                            </span>
                        </div>
                    )}

                    {/* Error */}
                    {error && !isLocked && (
                        <div className="mb-6 bg-red-950/50 border border-red-900/50 text-red-400 p-4 rounded-xl text-sm flex items-center gap-3">
                            <AlertCircle size={20} className="shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1.5">
                            <label htmlFor="admin-email" className="block text-sm font-bold text-slate-300">
                                البريد الإلكتروني للإدارة
                            </label>
                            <input
                                id="admin-email"
                                name="email"
                                type="email"
                                required
                                autoComplete="email"
                                disabled={isLocked}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-5 py-3.5 rounded-xl border border-slate-700 bg-slate-950/50 outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-white transition-all text-left ltr placeholder:text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
                                placeholder="admin@example.com"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="admin-password" className="block text-sm font-bold text-slate-300">
                                كلمة المرور الإدارية
                            </label>
                            <input
                                id="admin-password"
                                name="password"
                                type="password"
                                required
                                autoComplete="current-password"
                                disabled={isLocked}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-5 py-3.5 rounded-xl border border-slate-700 bg-slate-950/50 outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-white transition-all text-left ltr placeholder:text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
                                placeholder="••••••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || isLocked}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(5,150,105,0.2)] hover:shadow-[0_0_25px_rgba(5,150,105,0.4)] active:scale-[0.98] flex items-center justify-center gap-3 mt-6 border border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-600 disabled:active:scale-100"
                        >
                            {isLocked
                                ? <><Timer size={20} /><span className="text-base font-mono">
                                    {lockoutRemaining >= 60
                                        ? `${Math.ceil(lockoutRemaining / 60)}m`
                                        : `${lockoutRemaining}s`
                                    }
                                </span></>
                                : loading
                                    ? <><Loader2 className="animate-spin" size={20} /><span className="text-base">جاري التحقق من الصلاحيات...</span></>
                                    : <><ShieldCheck size={20} /><span className="text-base">تأكيد الدخول</span></>
                            }
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
