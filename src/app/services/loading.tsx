import { Briefcase, Loader2 } from 'lucide-react';

export default function ServicesLoading() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Hero Skeleton */}
            <div className="bg-slate-900 py-16 px-4 rounded-b-[80px] animate-pulse">
                <div className="max-w-3xl mx-auto text-center space-y-6">
                    <div className="h-12 bg-slate-800 rounded w-2/3 mx-auto"></div>
                    <div className="h-6 bg-slate-800 rounded w-1/2 mx-auto"></div>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-screen-2xl mx-auto px-4 py-12">
                <div className="text-center space-y-4">
                    <Loader2 size={40} className="animate-spin text-emerald-600 mx-auto" />
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                        جاري تحميل دليل الخدمات...
                    </p>
                </div>

                {/* Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-5 space-y-4 animate-pulse">
                            <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded"></div>
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
