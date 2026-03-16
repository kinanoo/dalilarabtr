'use client';

import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-full mb-5">
                <AlertTriangle size={48} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">خطأ في لوحة التحكم</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">حدث خطأ غير متوقع. جرّب إعادة المحاولة.</p>
            <div className="flex gap-3">
                <button onClick={reset} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition">
                    <RefreshCw size={18} /> إعادة المحاولة
                </button>
                <Link href="/admin" className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-xl font-bold transition hover:bg-slate-300">
                    <Home size={18} /> لوحة التحكم
                </Link>
            </div>
        </div>
    );
}
