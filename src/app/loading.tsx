/**
 * Global loading fallback — server component (zero JS sent to browser)
 * سكيليتون خفيف بدل spinner ثقيل مع useState و timers
 * هاد بيقلل حجم الـ bundle وبيسرّع أول عرض للصفحة
 */
export default function Loading() {
  return (
    <div className="min-h-[60vh] bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
        {/* Title skeleton */}
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-3/4" />
        {/* Subtitle skeleton */}
        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/2" />
        {/* Content skeleton lines */}
        <div className="space-y-3 pt-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-full" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-5/6" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-4/6" />
        </div>
        {/* Card skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
