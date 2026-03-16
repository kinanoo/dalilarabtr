export default function Loading() {
  return (
    <div className="min-h-[60vh] bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/2" />
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
        <div className="space-y-3 pt-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
