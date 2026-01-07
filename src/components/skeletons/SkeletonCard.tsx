export default function SkeletonCard() {
    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 animate-shimmer">
            {/* Image skeleton */}
            <div className="w-full h-48 bg-slate-200 dark:bg-slate-800 rounded-lg mb-4"></div>

            {/* Title skeleton */}
            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded mb-3 w-3/4"></div>

            {/* Description skeleton */}
            <div className="space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
            </div>
        </div>
    );
}
