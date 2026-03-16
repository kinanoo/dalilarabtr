'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import logger from '@/lib/logger';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        logger.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
            <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-full mb-6">
                <AlertTriangle size={64} className="text-red-500 dark:text-red-400" />
            </div>

            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                حدث خطأ غير متوقع
            </h2>

            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">
                نأسف للإزعاج. حدثت مشكلة أثناء محاولة عرض هذه الصفحة.
            </p>

            <button
                onClick={
                    // Attempt to recover by trying to re-render the segment
                    () => reset()
                }
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 px-6 py-3 rounded-xl font-bold transition-all"
            >
                <RefreshCw size={20} />
                حاول مرة أخرى
            </button>
        </div>
    );
}
