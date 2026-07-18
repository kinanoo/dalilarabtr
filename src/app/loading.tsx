/**
 * Root route-loading skeleton.
 *
 * Shown by the App Router during navigations and cold route transitions so a
 * weak network never sees a blank white screen while the next page streams —
 * a lightweight, motionless shell paints instantly instead. Kept intentionally
 * generic (a heading bar + a few content blocks) since it fronts every route.
 */
export default function Loading() {
    return (
        <div className="min-h-[60vh] w-full px-4 py-10" dir="rtl" aria-busy="true" aria-label="جارٍ التحميل">
            <div className="max-w-3xl mx-auto animate-pulse">
                <div className="h-8 w-2/3 rounded-lg bg-slate-200 dark:bg-slate-800 mb-4" />
                <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-900 mb-2" />
                <div className="h-4 w-5/6 rounded bg-slate-100 dark:bg-slate-900 mb-2" />
                <div className="h-4 w-4/6 rounded bg-slate-100 dark:bg-slate-900 mb-8" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-xl bg-slate-100 dark:bg-slate-900" />
                    ))}
                </div>
            </div>
        </div>
    );
}
