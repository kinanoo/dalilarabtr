'use client';

import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <title>خطأ في الخادم</title>
      </head>
      <body className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/40 dark:to-slate-950 min-h-screen flex items-center justify-center p-4 font-cairo">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 max-w-md text-center border border-transparent dark:border-slate-800">
          <div className="mb-6 flex justify-center">
            <div className="bg-red-100 dark:bg-red-950/40 p-4 rounded-full">
              <AlertTriangle className="text-red-600" size={40} />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">خطأ في الخادم</h1>
          <p className="text-slate-600 dark:text-slate-300 mb-2">عذراً، حدثت مشكلة غير متوقعة في النظام</p>
          {error.message && (
            <p className="text-xs text-slate-500 dark:text-slate-300 mb-6 bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
              {error.message}
            </p>
          )}

          <div className="space-y-3">
            <button
              onClick={() => reset()}
              className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              محاولة مجدداً
            </button>

            <Link
              href="/"
              className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition flex items-center justify-center gap-2 text-center"
            >
              <Home size={18} />
              العودة للرئيسية
            </Link>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-300 mb-2">تفاصيل الخطأ (التطوير فقط):</p>
              <pre className="text-xs bg-slate-100 dark:bg-slate-800 p-3 rounded text-left overflow-auto max-h-32">
                {error.stack}
              </pre>
            </div>
          )}
        </div>
      </body>
    </html>
  );
}
