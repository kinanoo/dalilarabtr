'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home, Copy } from 'lucide-react';
import Link from 'next/link';
import logger from '@/lib/logger';
import { toast } from 'sonner';

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    // Surface the error to logs so we have a trail even if the admin reloads.
    useEffect(() => {
        logger.error('AdminError boundary caught:', error);
    }, [error]);

    // Show error message only in dev — production digest is opaque on purpose
    // (it maps to a server log entry that the team can look up).
    const isDev = process.env.NODE_ENV !== 'production';

    function copyDiagnostics() {
        const payload = JSON.stringify({
            message: error.message || '(no message)',
            digest: error.digest || '(no digest)',
            url: typeof window !== 'undefined' ? window.location.href : '',
            ts: new Date().toISOString(),
        }, null, 2);
        navigator.clipboard?.writeText(payload).then(
            () => toast.success('تم نسخ تفاصيل الخطأ'),
            () => toast.error('تعذّر النسخ'),
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-full mb-5">
                <AlertTriangle size={48} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">خطأ في لوحة التحكم</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-2 max-w-md">حدث خطأ غير متوقع. جرّب إعادة المحاولة.</p>

            {isDev && error.message && (
                <pre className="text-xs text-left bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg p-3 mb-4 max-w-2xl overflow-auto" dir="ltr">
                    {error.message}
                </pre>
            )}

            {error.digest && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-4 font-mono" dir="ltr">
                    Ref: {error.digest}
                </p>
            )}

            <div className="flex flex-wrap gap-3 justify-center">
                <button onClick={reset} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition">
                    <RefreshCw size={18} /> إعادة المحاولة
                </button>
                <Link href="/admin" className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-xl font-bold transition hover:bg-slate-300">
                    <Home size={18} /> لوحة التحكم
                </Link>
                <button onClick={copyDiagnostics} className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-5 py-2.5 rounded-xl font-bold transition hover:border-slate-400">
                    <Copy size={18} /> نسخ التفاصيل
                </button>
            </div>
        </div>
    );
}
