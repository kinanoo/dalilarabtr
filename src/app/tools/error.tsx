'use client';

import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import logger from '@/lib/logger';
import { useEffect } from 'react';

export default function ArticleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => { logger.error(error); }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <div className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-full mb-5">
                <AlertTriangle size={48} className="text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">تعذّر تحميل الأداة</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">حدث خطأ أثناء تحميل هذه الأداة. جرّب مرة أخرى.</p>
            <div className="flex gap-3">
                <button onClick={reset} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition">
                    <RefreshCw size={18} /> إعادة المحاولة
                </button>
                <Link href="/" className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-xl font-bold transition hover:bg-slate-300">
                    <Home size={18} /> الرئيسية
                </Link>
            </div>
        </div>
    );
}
