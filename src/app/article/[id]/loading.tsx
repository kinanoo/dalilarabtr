import { FileText, Loader2 } from 'lucide-react';

export default function ArticleLoading() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <div className="max-w-4xl mx-auto px-4 py-12">
                {/* Hero Skeleton */}
                <div className="mb-8 space-y-4 animate-pulse">
                    <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4"></div>
                    <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
                </div>

                {/* Content Skeleton */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 space-y-4 animate-pulse">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-4/6"></div>
                </div>

                {/* Loading Indicator */}
                <div className="text-center mt-8">
                    <Loader2 size={32} className="animate-spin text-primary-600 mx-auto" />
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">جاري تحميل المقال...</p>
                </div>
            </div>
        </div>
    );
}
