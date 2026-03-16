'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import logger from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * مكون معالجة الأخطاء (Error Boundary)
 * يمسك الأخطاء ويظهر واجهة صديقة بدلاً من التعطل
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('❌ Error caught by boundary:', error, errorInfo);
    // يمكنك إضافة خدمة تسجيل الأخطاء هنا (مثل Sentry)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/40 dark:to-slate-950 flex items-center justify-center p-4 font-cairo">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 max-w-md text-center border border-transparent dark:border-slate-800">
            <div className="mb-6 flex justify-center">
              <div className="bg-red-100 dark:bg-red-950/40 p-4 rounded-full">
                <AlertTriangle className="text-red-600" size={40} />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">حدث خطأ</h1>
            <p className="text-slate-600 dark:text-slate-300 mb-2">عذراً، حدثت مشكلة غير متوقعة</p>
            {this.state.error && (
              <p className="text-xs text-slate-500 dark:text-slate-300 mb-6 bg-slate-100 dark:bg-slate-800 p-3 rounded-lg overflow-auto max-h-20">
                {this.state.error.message}
              </p>
            )}
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                تحديث الصفحة
              </button>
              
              <Link
                href="/"
                className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition flex items-center justify-center gap-2"
              >
                <Home size={18} />
                العودة للرئيسية
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * مكون معالجة الأخطاء لـ App Router (Client Component)
 * يُستخدم في layout.tsx للتطبيق بأكمله
 */
export function ErrorBoundaryWrapper({ children }: { children: ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      setError(event.error);
      logger.error('Global error:', event.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError && error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/40 dark:to-slate-950 flex items-center justify-center p-4 font-cairo">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 max-w-md text-center border border-transparent dark:border-slate-800">
          <div className="mb-6 flex justify-center">
            <div className="bg-red-100 dark:bg-red-950/40 p-4 rounded-full">
              <AlertTriangle className="text-red-600" size={40} />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">حدث خطأ</h1>
          <p className="text-slate-600 dark:text-slate-300 mb-6">{error.message}</p>
          
          <button
            onClick={() => {
              setHasError(false);
              setError(null);
              window.location.reload();
            }}
            className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition"
          >
            حاول مجدداً
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
