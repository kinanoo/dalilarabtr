'use client';

import { useEffect, useState } from 'react';
import { Loader2, WifiOff, RefreshCw } from 'lucide-react';

export default function Loading() {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => setElapsed(s => s + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    // Phase 1: Normal loading (0-5s)
    if (elapsed < 5) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] bg-slate-50 dark:bg-slate-950">
                <div className="text-center space-y-4">
                    <Loader2 size={40} className="animate-spin text-emerald-600 mx-auto" />
                    <p className="text-base font-bold text-slate-600 dark:text-slate-300">
                        جاري التحميل...
                    </p>
                </div>
            </div>
        );
    }

    // Phase 2: Taking long (5-15s)
    if (elapsed < 15) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] bg-slate-50 dark:bg-slate-950">
                <div className="text-center space-y-4 max-w-sm mx-auto px-4">
                    <Loader2 size={40} className="animate-spin text-amber-500 mx-auto" />
                    <p className="text-base font-bold text-slate-700 dark:text-slate-200">
                        التحميل أبطأ من المعتاد...
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        يبدو أن الخادم يحتاج وقتاً أطول. يرجى الانتظار.
                    </p>
                </div>
            </div>
        );
    }

    // Phase 3: Likely a problem (15s+)
    return (
        <div className="flex items-center justify-center min-h-[60vh] bg-slate-50 dark:bg-slate-950">
            <div className="text-center space-y-5 max-w-sm mx-auto px-4">
                <WifiOff size={48} className="text-red-400 mx-auto" />
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    تعذّر تحميل الصفحة
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    قد يكون هناك مشكلة مؤقتة في الخادم. جرّب تحديث الصفحة.
                </p>
                <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors shadow-lg"
                >
                    <RefreshCw size={16} />
                    تحديث الصفحة
                </button>
            </div>
        </div>
    );
}
