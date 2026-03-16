export default function Loading() {
  return (
    <div className="min-h-[60vh] bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/3" />
        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/2" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
