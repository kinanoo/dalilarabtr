export default function Loading() {
  return (
    <div className="min-h-[60vh] bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-2/5" />
        <div className="flex gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl flex-1" />
          ))}
        </div>
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
        <div className="space-y-4 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
