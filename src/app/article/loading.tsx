export default function Loading() {
  return (
    <div className="min-h-[60vh] bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-24" />
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-4/5" />
        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3" />
        <div className="space-y-3 pt-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-full" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-5/6" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-full" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4" />
        </div>
        <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl mt-4" />
      </div>
    </div>
  );
}
