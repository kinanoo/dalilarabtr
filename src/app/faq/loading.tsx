import { HelpCircle, Loader2 } from 'lucide-react';

export default function FAQLoading() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <div className="max-w-4xl mx-auto px-4 py-12">
                {/* Header Skeleton */}
                <div className="text-center mb-12 space-y-4 animate-pulse">
                    <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mx-auto"></div>
                    <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-2/3 mx-auto"></div>
                </div>

                {/* Loading Indicator */}
                <div className="text-center space-y-4 mb-8">
                    <Loader2 size={40} className="animate-spin text-primary-600 mx-auto" />
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                        جاري تحميل الأسئلة الشائعة...
                    </p>
                </div>

                {/* FAQ Skeleton */}
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 rounded-xl p-5 space-y-3 animate-pulse">
                            <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
